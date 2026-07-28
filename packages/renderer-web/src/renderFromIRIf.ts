import type { IRIfNode, IRNode } from "@terajs/compiler";
import { dispose, effect, withDetachedCurrentEffect } from "@terajs/reactivity";
import {
  createComponentContext,
  getCurrentContext,
  setCurrentContext,
  type ComponentContext
} from "@terajs/runtime";
import { addNodeCleanup, createFragment, insert, remove } from "./dom.js";
import { emitRendererDebug, rendererDebugEnabled } from "./debug.js";
import { resolveExpr } from "./renderFromIRExpressions.js";
import { inheritRouteOutletRenderContext } from "./routeOutletContext.js";

export type RenderIRNode = (node: IRNode, ctx: any, isSvg?: boolean) => Node | null;

export function renderIRIfNode(
  node: IRIfNode,
  ctx: any,
  isSvg: boolean,
  renderIRNode: RenderIRNode
): Node {
  if (rendererDebugEnabled) {
    emitRendererDebug("ir:render:if", () => ({ condition: node.condition }));
  }

  const anchor = document.createComment("if");
  const fragment = createFragment();
  const ownedNodes: ChildNode[] = [];
  const ownerContext = getCurrentContext();
  let branchContext: ComponentContext | null = null;
  let renderedBranch: boolean | null = null;

  fragment.appendChild(anchor);

  const effectFn = effect(() => {
    const condition = Boolean(resolveExpr(ctx, node.condition));
    if (renderedBranch === condition) {
      return;
    }

    const renderBranch = () => {
      const branch = condition ? node.then : node.else ?? [];
      const container = anchor.parentNode as ParentNode | null;
      if (!container) return;

      disposeBranchContext(branchContext);
      branchContext = createBranchContext(ownerContext);
      for (const owned of ownedNodes) remove(owned);
      ownedNodes.length = 0;

      const previousContext = getCurrentContext();
      setCurrentContext(branchContext);
      try {
        let ref: ChildNode | null = anchor.nextSibling;
        for (const child of branch) {
          const dom = renderIRNode(child, ctx, isSvg);
          if (dom && dom instanceof Node) {
            const insertedNodes = dom instanceof DocumentFragment
              ? Array.from(dom.childNodes)
              : [dom as ChildNode];

            insert(container as any, dom, ref ?? null);
            ownedNodes.push(...insertedNodes);
            ref = null;
          }
        }
        renderedBranch = condition;
      } finally {
        setCurrentContext(previousContext);
      }
    };

    withDetachedCurrentEffect(renderBranch);
  });

  addNodeCleanup(anchor, () => {
    dispose(effectFn);
    disposeBranchContext(branchContext);
    branchContext = null;
    for (const owned of ownedNodes) remove(owned);
    ownedNodes.length = 0;
  });

  return fragment;
}

function createBranchContext(owner: ComponentContext | null): ComponentContext {
  const branch = createComponentContext();
  if (!owner) {
    return branch;
  }

  branch.errorBoundary = owner.errorBoundary;
  branch.route = owner.route;
  branch.meta = owner.meta;
  branch.ai = owner.ai;
  inheritRouteOutletRenderContext(owner, branch);
  return branch;
}

function disposeBranchContext(context: ComponentContext | null): void {
  if (!context) {
    return;
  }

  const disposers = context.disposers.splice(0, context.disposers.length);
  for (const cleanup of disposers) {
    try {
      cleanup();
    } catch {
      // Structural branch teardown remains non-fatal.
    }
  }
}
