/**
 * @file hostIRForRenderer.ts
 * @description
 * Host-generic renderer for IRForNode. DOM ownership stays in renderFromIRFor.ts;
 * this module only depends on the shared renderer host contract.
 */
import type { IRForNode, IRNode } from "@terajs/compiler";
import type { RendererHost } from "@terajs/renderer";

import { dispose, effect, signal, withDetachedCurrentEffect, type Signal } from "@terajs/reactivity";
import {
  createComponentContext,
  getCurrentContext,
  setCurrentContext,
  type ComponentContext,
} from "@terajs/runtime";

import { emitRendererDebug } from "./debug.js";
import { EXPRESSION_UNWRAP_LOCALS, resolveExpr } from "./renderFromIRExpressions.js";
import { updateKeyedList, type KeyedItem } from "./updateKeyedList.js";

type RenderIRNode<NodeLike> = (node: IRNode, ctx: any, isSvg?: boolean) => NodeLike | null;

type IRForHost<NodeLike, FragmentLike extends NodeLike = NodeLike> = Pick<
  RendererHost<NodeLike, any, any, FragmentLike>,
  | "addNodeCleanup"
  | "createAnchor"
  | "createFragment"
  | "getChildren"
  | "getNextSibling"
  | "getParent"
  | "insert"
  | "isFragment"
  | "remove"
>;

interface IRForRowRecord<NodeLike> extends KeyedItem<NodeLike> {
  itemSignal: Signal<unknown>;
  indexSignal: Signal<number>;
  ownerContext: ComponentContext;
}

interface IRForIdentityState {
  objectIds: WeakMap<object, number>;
  nextObjectId: number;
}

export function createIRForRenderer<NodeLike, FragmentLike extends NodeLike = NodeLike>(host: IRForHost<NodeLike, FragmentLike>) {
  const {
    addNodeCleanup,
    createAnchor,
    createFragment,
    getChildren,
    getNextSibling,
    getParent,
    insert,
    isFragment,
    remove,
  } = host;

  return function renderIRForNode(
    node: IRForNode,
    ctx: any,
    isSvg: boolean,
    renderNode: RenderIRNode<NodeLike>,
  ): NodeLike {
    emitRendererDebug("ir:render:for", () => ({ each: node.each }));

    const anchor = createAnchor("for");
    const parent = createFragment();
    insert(parent as NodeLike, anchor as NodeLike);

    const ownerContext = getCurrentContext();
    const identityState = createIRForIdentityState();
    const supportsKeyedReuse = node.body.length === 1;
    let rows: IRForRowRecord<NodeLike>[] = [];
    let rebuiltNodes: NodeLike[] = [];

    const clearRows = () => {
      for (const row of rows) {
        remove(row.node);
        disposeIRForRowRecord(row);
      }
      rows = [];
    };

    const clearRebuiltNodes = () => {
      for (const rebuiltNode of rebuiltNodes) {
        remove(rebuiltNode);
      }
      rebuiltNodes = [];
    };

    const run = () => {
      const array = resolveExpr(ctx, node.each) || [];
      const mountTarget = getParent(anchor as NodeLike) ?? (parent as NodeLike);

      if (supportsKeyedReuse && Array.isArray(array)) {
        const reusedRows = createKeyedIRForRows(
          node,
          ctx,
          isSvg,
          array,
          rows,
          ownerContext,
          identityState,
          renderNode,
          isFragment,
          getChildren,
        );

        if (reusedRows) {
          if (rebuiltNodes.length > 0) {
            clearRebuiltNodes();
          }

          updateKeyedList(
            mountTarget,
            rows,
            reusedRows,
            (item, target, anchorNode) => insert(target, item.node, anchorNode),
            (item) => {
              remove(item.node);
              disposeIRForRowRecord(item);
            },
            (item, target, anchorNode) => insert(target, item.node, anchorNode),
          );

          rows = reusedRows;
          return;
        }

        clearRows();
      }

      if (rows.length > 0) {
        clearRows();
      }

      rebuiltNodes = renderIRForByRebuild(
        node,
        ctx,
        isSvg,
        Array.isArray(array) ? array : [],
        mountTarget,
        anchor as NodeLike,
        renderNode,
        isFragment,
        getChildren,
        getNextSibling,
        insert,
        remove,
        rebuiltNodes,
      );
    };

    const effectFn = effect(run);

    addNodeCleanup(anchor as NodeLike, () => {
      dispose(effectFn);
      clearRows();
      clearRebuiltNodes();
    });

    return parent as NodeLike;
  };
}

function renderIRForByRebuild(
  node: IRForNode,
  ctx: any,
  isSvg: boolean,
  array: any[],
  parent: any,
  anchor: any,
  renderNode: RenderIRNode<any>,
  isFragment: (node: any) => boolean,
  getChildren: (node: any) => any[],
  getNextSibling: (node: any) => any,
  insert: (parent: any, child: any, anchor?: any | null) => void,
  remove: (node: any) => void,
  ownedNodes: any[],
): any[] {
  for (const ownedNode of ownedNodes) {
    remove(ownedNode);
  }

  const nodes: any[] = [];

  for (let index = 0; index < array.length; index += 1) {
    const childCtx = {
      ...ctx,
      [node.item]: array[index],
      [node.index ?? "i"]: index,
    };

    for (const child of node.body) {
      const dom = renderNode(child, childCtx, isSvg);
      if (dom) {
        nodes.push(...collectIRForRenderedNodes(dom, isFragment, getChildren));
      }
    }
  }

  let ref = getNextSibling(anchor);
  for (const renderedNode of nodes) {
    insert(parent, renderedNode, ref ?? null);
    ref = null;
  }

  return nodes;
}

function createKeyedIRForRows<NodeLike>(
  node: IRForNode,
  ctx: any,
  isSvg: boolean,
  array: any[],
  currentRows: IRForRowRecord<NodeLike>[],
  ownerContext: ComponentContext | null,
  identityState: IRForIdentityState,
  renderNode: RenderIRNode<NodeLike>,
  isFragment: (node: NodeLike) => boolean,
  getChildren: (node: NodeLike) => NodeLike[],
): IRForRowRecord<NodeLike>[] | null {
  const nextRows: IRForRowRecord<NodeLike>[] = [];
  const currentRowsByKey = new Map(currentRows.map((row) => [row.key, row]));
  const seenCounts = new Map<string, number>();

  for (let index = 0; index < array.length; index += 1) {
    const item = array[index];
    const key = createIRForRowKey(node, ctx, item, index, identityState, seenCounts);
    const existing = currentRowsByKey.get(key);

    if (existing) {
      currentRowsByKey.delete(key);

      withDetachedCurrentEffect(() => {
        existing.itemSignal.set(item);
        existing.indexSignal.set(index);
      });

      nextRows.push(existing);
      continue;
    }

    const created = createIRForRowRecord(node, ctx, isSvg, item, index, key, ownerContext, renderNode, isFragment, getChildren);
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

function collectIRForRenderedNodes<NodeLike>(
  node: NodeLike,
  isFragment: (node: NodeLike) => boolean,
  getChildren: (node: NodeLike) => NodeLike[],
): NodeLike[] {
  if (isFragment(node)) {
    return getChildren(node);
  }

  return [node];
}

function createIRForRowKey(
  node: IRForNode,
  ctx: any,
  item: unknown,
  index: number,
  identityState: IRForIdentityState,
  seenCounts: Map<string, number>,
): string {
  const base = describeIRForRowIdentity(resolveIRForRowIdentity(node, ctx, item, index) ?? item, index, identityState);
  const count = seenCounts.get(base) ?? 0;
  seenCounts.set(base, count + 1);
  return `${base}::${count}`;
}

function resolveIRForRowIdentity(
  node: IRForNode,
  ctx: any,
  item: unknown,
  index: number,
): unknown {
  if (!node.key) {
    return undefined;
  }

  if (node.key.kind === "static") {
    return node.key.value;
  }

  if (typeof node.key.value === "string") {
    return resolveExpr(
      {
        ...ctx,
        [node.item]: item,
        [node.index ?? "i"]: index,
      },
      node.key.value,
    );
  }

  return node.key.value;
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

function createIRForRowRecord<NodeLike>(
  node: IRForNode,
  ctx: any,
  isSvg: boolean,
  item: unknown,
  index: number,
  key: string,
  ownerContext: ComponentContext | null,
  renderNode: RenderIRNode<NodeLike>,
  isFragment: (node: NodeLike) => boolean,
  getChildren: (node: NodeLike) => NodeLike[],
): IRForRowRecord<NodeLike> | null {
  const itemSignal = signal(item);
  const indexSignal = signal(index);
  const rowContext = createComponentContext();

  if (ownerContext) {
    rowContext.errorBoundary = ownerContext.errorBoundary;
    rowContext.route = ownerContext.route;
    rowContext.meta = ownerContext.meta;
    rowContext.ai = ownerContext.ai;
  }

  const rowChildContext = createIRForRowContext(node, ctx, itemSignal, indexSignal);

  const previousContext = getCurrentContext();
  let renderedNode: NodeLike | null = null;

  setCurrentContext(rowContext);
  try {
    renderedNode = withDetachedCurrentEffect(() => renderNode(node.body[0], rowChildContext, isSvg));
  } finally {
    setCurrentContext(previousContext);
  }

  const normalizedNode = normalizeIRForRowNode(renderedNode, isFragment, getChildren);
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

function createIRForRowContext(
  node: IRForNode,
  ctx: any,
  itemSignal: Signal<unknown>,
  indexSignal: Signal<number>,
): any {
  const indexName = node.index ?? "i";
  const inheritedUnwrapLocals = ctx?.[EXPRESSION_UNWRAP_LOCALS];
  const unwrapLocals = new Set<string>(inheritedUnwrapLocals instanceof Set ? inheritedUnwrapLocals : []);
  const rowChildContext = {
    ...ctx,
    [node.item]: itemSignal,
    [indexName]: indexSignal,
  };

  unwrapLocals.add(node.item);
  unwrapLocals.add(indexName);

  Object.defineProperty(rowChildContext, EXPRESSION_UNWRAP_LOCALS, {
    configurable: true,
    enumerable: false,
    value: unwrapLocals,
  });

  return rowChildContext;
}

function normalizeIRForRowNode<NodeLike>(
  node: NodeLike | null,
  isFragment: (node: NodeLike) => boolean,
  getChildren: (node: NodeLike) => NodeLike[],
): NodeLike | null {
  if (!node) {
    return null;
  }

  if (isFragment(node)) {
    const children = getChildren(node);
    if (children.length !== 1) {
      return null;
    }

    return children[0] ?? null;
  }

  return node;
}

function disposeIRForRowRecord<NodeLike>(row: IRForRowRecord<NodeLike>): void {
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
