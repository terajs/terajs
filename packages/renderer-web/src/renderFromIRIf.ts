import type { IRIfNode, IRNode } from "@terajs/compiler";
import { dispose, effect } from "@terajs/reactivity";
import { getCurrentContext, runWithCurrentContext } from "@terajs/runtime";
import { addNodeCleanup, createFragment, insert, remove } from "./dom.js";
import { emitRendererDebug, rendererDebugEnabled } from "./debug.js";
import { resolveExpr } from "./renderFromIRExpressions.js";

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

  fragment.appendChild(anchor);

  const effectFn = effect(() => {
    const renderBranch = () => {
      const branch = resolveExpr(ctx, node.condition) ? node.then : node.else ?? [];
      const container = anchor.parentNode as ParentNode | null;
      if (!container) return;

      for (const owned of ownedNodes) remove(owned);
      ownedNodes.length = 0;

      let ref: ChildNode | null = anchor.nextSibling;
      for (const child of branch) {
        const dom = renderIRNode(child, ctx, isSvg);
        if (dom && dom instanceof Node && "remove" in dom) {
          insert(container as any, dom as ChildNode, ref ?? null);
          ownedNodes.push(dom as ChildNode);
          ref = null;
        }
      }
    };

    if (ownerContext) {
      runWithCurrentContext(ownerContext, renderBranch);
    } else {
      renderBranch();
    }
  });

  addNodeCleanup(anchor, () => {
    dispose(effectFn);
    for (const owned of ownedNodes) remove(owned);
    ownedNodes.length = 0;
  });

  return fragment;
}
