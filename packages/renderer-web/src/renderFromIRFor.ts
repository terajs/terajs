/** 
 * @file renderFromIRFor.ts
 * @description
 * Renderer for IRForNode, which represents a v-for loop in the template.
 *
 * This module handles both keyed and non-keyed v-for lists, with optimizations
 */
import type { IRForNode, IRNode, IRPropNode } from "@terajs/compiler";

import { dispose, effect, signal, withDetachedCurrentEffect, type Signal } from "@terajs/reactivity";
import {
  createComponentContext,
  getCurrentContext,
  runWithCurrentContext,
  setCurrentContext,
  type ComponentContext,
} from "@terajs/runtime";

import {
  addNodeCleanup,
  createFragment,
  insert,
  remove,
} from "./dom.js";
import { emitRendererDebug } from "./debug.js";
import { resolveExpr } from "./renderFromIRExpressions.js";
import { inheritRouteOutletRenderContext } from "./routeOutletContext.js";
import { updateKeyedList, type KeyedItem } from "./updateKeyedList.js";

type RenderIRNode = (node: IRNode, ctx: any, isSvg?: boolean) => Node | null;

interface IRForRowRecord extends KeyedItem {
  itemSignal: Signal<unknown>;
  indexSignal: Signal<number>;
  ownerContext: ComponentContext;
}

interface IRForIdentityState {
  objectIds: WeakMap<object, number>;
  nextObjectId: number;
}

export function renderIRForNode(
  node: IRForNode,
  ctx: any,
  isSvg: boolean,
  renderNode: RenderIRNode,
): Node {
  emitRendererDebug("ir:render:for", () => ({ each: node.each }));

  const anchor = document.createComment("for");
  const parent = createFragment();
  parent.appendChild(anchor);

  const ownerContext = getCurrentContext();
  const identityState = createIRForIdentityState();
  const keyProp = getIRForKeyProp(node);
  const supportsKeyedReuse = node.body.length === 1 && (node.isStructural !== true || keyProp !== null);
  let rows: IRForRowRecord[] = [];
  let rebuiltNodes: ChildNode[] = [];

  const renderRows = () => {
    const array = resolveExpr(ctx, node.each) || [];
    const mountTarget = anchor.parentNode ?? parent;

    if (supportsKeyedReuse && Array.isArray(array)) {
      const reusedRows = createKeyedIRForRows(
        node,
        ctx,
        isSvg,
        array,
        rows,
        ownerContext,
        identityState,
        keyProp,
        renderNode,
      );

      if (reusedRows) {
        updateKeyedList(
          mountTarget,
          rows,
          reusedRows,
          (item, target, anchorNode) => insert(target, item.node, anchorNode),
          (item) => {
            remove(item.node);
            disposeIRForRowRecord(item as IRForRowRecord);
          },
        );

        rows = reusedRows;
        return;
      }

      for (const row of rows) {
        disposeIRForRowRecord(row);
      }
      rows = [];
    }

    renderIRForByRebuild(
      node,
      ctx,
      isSvg,
      Array.isArray(array) ? array : [],
      mountTarget,
      anchor,
      rebuiltNodes,
      renderNode,
    );
  };

  const run = () => {
    if (ownerContext) {
      runWithCurrentContext(ownerContext, renderRows);
      return;
    }

    renderRows();
  };

  const effectFn = effect(run);

  addNodeCleanup(anchor, () => {
    dispose(effectFn);
    for (const row of rows) disposeIRForRowRecord(row);
    rows = [];
    for (const node of rebuiltNodes) remove(node);
    rebuiltNodes = [];
  });

  return parent;
}

function renderIRForByRebuild(
  node: IRForNode,
  ctx: any,
  isSvg: boolean,
  array: any[],
  parent: Node,
  anchor: Comment,
  ownedNodes: ChildNode[],
  renderNode: RenderIRNode,
): void {
  for (const ownedNode of ownedNodes) {
    remove(ownedNode);
  }
  ownedNodes.length = 0;

  const fragment = createFragment();

  try {
    for (let index = 0; index < array.length; index += 1) {
      const childCtx = {
        ...ctx,
        [node.item]: array[index],
        [node.index ?? "i"]: index,
      };

      for (const child of node.body) {
        const dom = renderNode(child, childCtx, isSvg);
        if (dom) {
          fragment.appendChild(dom);
        }
      }
    }
  } catch (error) {
    while (fragment.firstChild) {
      remove(fragment.firstChild);
    }
    throw error;
  }

  ownedNodes.push(...Array.from(fragment.childNodes));
  insert(parent, fragment, anchor.nextSibling);
}

function createKeyedIRForRows(
  node: IRForNode,
  ctx: any,
  isSvg: boolean,
  array: any[],
  currentRows: IRForRowRecord[],
  ownerContext: ComponentContext | null,
  identityState: IRForIdentityState,
  keyProp: IRPropNode | null,
  renderNode: RenderIRNode,
): IRForRowRecord[] | null {
  const nextRows: IRForRowRecord[] = [];
  const currentRowsByKey = new Map(currentRows.map((row) => [row.key, row]));
  const seenCounts = new Map<string, number>();

  for (let index = 0; index < array.length; index += 1) {
    const item = array[index];
    const key = createIRForRowKey(node, ctx, keyProp, item, index, identityState, seenCounts);
    const existing = currentRowsByKey.get(key);

    if (existing) {
      existing.itemSignal.set(item);
      existing.indexSignal.set(index);
      nextRows.push(existing);
      continue;
    }

    const created = createIRForRowRecord(node, ctx, isSvg, item, index, key, ownerContext, renderNode);
    if (!created) {
      for (const row of nextRows) {
        if (!currentRowsByKey.has(row.key)) {
          disposeIRForRowRecord(row);
        }
      }
      return null;
    }

    nextRows.push(created);
  }

  return nextRows;
}

function createIRForIdentityState(): IRForIdentityState {
  return {
    objectIds: new WeakMap<object, number>(),
    nextObjectId: 1,
  };
}

function createIRForRowKey(
  node: IRForNode,
  ctx: any,
  keyProp: IRPropNode | null,
  item: unknown,
  index: number,
  identityState: IRForIdentityState,
  seenCounts: Map<string, number>,
): string {
  const explicitKey = resolveIRForExplicitKey(node, ctx, keyProp, item, index);
  const base = explicitKey.found
    ? `explicit:${typeof explicitKey.value}:${String(explicitKey.value)}`
    : describeIRForRowIdentity(item, index, identityState);
  const count = seenCounts.get(base) ?? 0;
  seenCounts.set(base, count + 1);
  return `${base}::${count}`;
}

function getIRForKeyProp(node: IRForNode): IRPropNode | null {
  const root = node.body[0];
  if (!root || root.type !== "element") {
    return null;
  }

  return root.props.find((prop) =>
    prop.name === "key" && (prop.kind === "bind" || prop.kind === "static")
  ) ?? null;
}

function resolveIRForExplicitKey(
  node: IRForNode,
  ctx: any,
  keyProp: IRPropNode | null,
  item: unknown,
  index: number,
): { found: boolean; value?: unknown } {
  if (!keyProp) {
    return { found: false };
  }

  if (keyProp.kind === "static") {
    return { found: true, value: keyProp.value };
  }

  const childCtx = {
    ...ctx,
    [node.item]: item,
    [node.index ?? "i"]: index,
  };

  return {
    found: true,
    value: resolveExpr(childCtx, String(keyProp.value)),
  };
}

function describeIRForRowIdentity(
  item: unknown,
  index: number,
  identityState: IRForIdentityState,
): string {
  if (item && typeof item === "object") {
    const candidate = item as { key?: unknown; id?: unknown };
    if (candidate.key != null) {
      return `key:${String(candidate.key)}`;
    }

    if (candidate.id != null) {
      return `id:${String(candidate.id)}`;
    }

    let objectId = identityState.objectIds.get(item);
    if (!objectId) {
      objectId = identityState.nextObjectId;
      identityState.objectIds.set(item, objectId);
      identityState.nextObjectId += 1;
    }

    return `object:${objectId}`;
  }

  if (typeof item === "function") {
    return `function:${index}`;
  }

  return `value:${typeof item}:${String(item)}`;
}

function createIRForRowRecord(
  node: IRForNode,
  ctx: any,
  isSvg: boolean,
  item: unknown,
  index: number,
  key: string,
  ownerContext: ComponentContext | null,
  renderNode: RenderIRNode,
): IRForRowRecord | null {
  const itemSignal = signal(item);
  const indexSignal = signal(index);
  const rowContext = createComponentContext();

  if (ownerContext) {
    rowContext.errorBoundary = ownerContext.errorBoundary;
    rowContext.route = ownerContext.route;
    rowContext.meta = ownerContext.meta;
    rowContext.ai = ownerContext.ai;
    inheritRouteOutletRenderContext(ownerContext, rowContext);
  }

  const rowChildContext = Object.create(ctx ?? null);
  Object.defineProperty(rowChildContext, node.item, {
    configurable: true,
    enumerable: true,
    get: () => itemSignal(),
  });
  Object.defineProperty(rowChildContext, node.index ?? "i", {
    configurable: true,
    enumerable: true,
    get: () => indexSignal(),
  });

  const previousContext = getCurrentContext();
  let renderedNode: Node | null = null;

  setCurrentContext(rowContext);
  try {
    renderedNode = withDetachedCurrentEffect(() => renderNode(node.body[0], rowChildContext, isSvg));
  } finally {
    setCurrentContext(previousContext);
  }

  const normalizedNode = normalizeIRForRowNode(renderedNode);
  if (!normalizedNode) {
    disposeIRForRowContext(rowContext);
    return null;
  }

  return {
    key,
    node: normalizedNode,
    itemSignal,
    indexSignal,
    ownerContext: rowContext,
  };
}

function normalizeIRForRowNode(node: Node | null): Node | null {
  if (!node) {
    return null;
  }

  if (node instanceof DocumentFragment) {
    if (node.childNodes.length !== 1) {
      return null;
    }

    return node.firstChild as Node;
  }

  return node;
}

function disposeIRForRowRecord(row: IRForRowRecord): void {
  disposeIRForRowContext(row.ownerContext);
}

function disposeIRForRowContext(ctx: ComponentContext): void {
  const disposers = ctx.disposers.splice(0, ctx.disposers.length);
  for (const cleanup of disposers) {
    try {
      cleanup();
    } catch {
      // Row teardown should stay non-fatal.
    }
  }
}
