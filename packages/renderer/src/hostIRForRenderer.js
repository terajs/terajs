import { dispose, effect, signal, withDetachedCurrentEffect } from "@terajs/reactivity";
import { createComponentContext, getCurrentContext, setCurrentContext, } from "@terajs/shared";
import { emitRendererDebug } from "./debug.js";
import { EXPRESSION_UNWRAP_LOCALS, resolveExpr } from "./renderFromIRExpressions.js";
import { updateKeyedList } from "./updateKeyedList.js";
export function createIRForRenderer(host) {
    const { addNodeCleanup, createAnchor, createFragment, getChildren, getNextSibling, getParent, isFragment, } = host;
    const insert = (parent, child, anchor) => host.insert(parent, child, anchor);
    const remove = (node) => host.remove(node);
    return function renderIRForNode(node, ctx, isSvg, renderNode) {
        emitRendererDebug("ir:render:for", () => ({ each: node.each }));
        const anchor = createAnchor("for");
        const parent = createFragment();
        insert(parent, anchor);
        const ownerContext = getCurrentContext();
        const identityState = createIRForIdentityState();
        const supportsKeyedReuse = node.body.length === 1;
        let rows = [];
        let rebuiltNodes = [];
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
            const mountTarget = getParent(anchor) ?? parent;
            if (supportsKeyedReuse && Array.isArray(array)) {
                const reusedRows = createKeyedIRForRows(node, ctx, isSvg, array, rows, ownerContext, identityState, renderNode, isFragment, getChildren);
                if (reusedRows) {
                    if (rebuiltNodes.length > 0) {
                        clearRebuiltNodes();
                    }
                    updateKeyedList(mountTarget, rows, reusedRows, (item, target, anchorNode) => insert(target, item.node, anchorNode), (item) => {
                        remove(item.node);
                        disposeIRForRowRecord(item);
                    }, (item, target, anchorNode) => insert(target, item.node, anchorNode));
                    rows = reusedRows;
                    return;
                }
                clearRows();
            }
            if (rows.length > 0) {
                clearRows();
            }
            rebuiltNodes = renderIRForByRebuild(node, ctx, isSvg, Array.isArray(array) ? array : [], mountTarget, anchor, renderNode, isFragment, getChildren, getNextSibling, insert, remove, rebuiltNodes);
        };
        const effectFn = effect(run);
        addNodeCleanup(anchor, () => {
            dispose(effectFn);
            clearRows();
            clearRebuiltNodes();
        });
        return parent;
    };
}
function renderIRForByRebuild(node, ctx, isSvg, array, parent, anchor, renderNode, isFragment, getChildren, getNextSibling, insert, remove, ownedNodes) {
    for (const ownedNode of ownedNodes) {
        remove(ownedNode);
    }
    const nodes = [];
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
function createKeyedIRForRows(node, ctx, isSvg, array, currentRows, ownerContext, identityState, renderNode, isFragment, getChildren) {
    const nextRows = [];
    const currentRowsByKey = new Map(currentRows.map((row) => [row.key, row]));
    const seenCounts = new Map();
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
function createIRForIdentityState() {
    return {
        objectIds: new WeakMap(),
        nextObjectId: 1,
    };
}
function collectIRForRenderedNodes(node, isFragment, getChildren) {
    if (isFragment(node)) {
        return getChildren(node);
    }
    return [node];
}
function createIRForRowKey(node, ctx, item, index, identityState, seenCounts) {
    const base = describeIRForRowIdentity(resolveIRForRowIdentity(node, ctx, item, index) ?? item, index, identityState);
    const count = seenCounts.get(base) ?? 0;
    seenCounts.set(base, count + 1);
    return `${base}::${count}`;
}
function resolveIRForRowIdentity(node, ctx, item, index) {
    if (!node.key) {
        return undefined;
    }
    if (node.key.kind === "static") {
        return node.key.value;
    }
    if (typeof node.key.value === "string") {
        return resolveExpr({
            ...ctx,
            [node.item]: item,
            [node.index ?? "i"]: index,
        }, node.key.value);
    }
    return node.key.value;
}
function describeIRForRowIdentity(item, index, identityState) {
    if (item && typeof item === "object") {
        const candidate = item;
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
function createIRForRowRecord(node, ctx, isSvg, item, index, key, ownerContext, renderNode, isFragment, getChildren) {
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
    let renderedNode = null;
    try {
        setCurrentContext(rowContext);
        withDetachedCurrentEffect(() => {
            renderedNode = renderNode(node.body[0], rowChildContext, isSvg);
        });
    }
    finally {
        setCurrentContext(previousContext);
    }
    if (!renderedNode) {
        return null;
    }
    const nodeForList = isFragment(renderedNode)
        ? (getChildren(renderedNode)[0] ?? null)
        : renderedNode;
    if (!nodeForList) {
        disposeIRForRowContext(rowContext);
        return null;
    }
    return {
        key,
        node: nodeForList,
        itemSignal,
        indexSignal,
        ownerContext: rowContext,
    };
}
function createIRForRowContext(node, ctx, itemSignal, indexSignal) {
    const indexName = node.index ?? "i";
    const inheritedUnwrapLocals = ctx?.[EXPRESSION_UNWRAP_LOCALS];
    const unwrapLocals = new Set(inheritedUnwrapLocals instanceof Set ? inheritedUnwrapLocals : []);
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
function disposeIRForRowRecord(row) {
    disposeIRForRowContext(row.ownerContext);
}
function disposeIRForRowContext(ctx) {
    const disposers = ctx.disposers.splice(0, ctx.disposers.length);
    for (const cleanup of disposers) {
        try {
            cleanup();
        }
        catch {
            // Row teardown should stay non-fatal.
        }
    }
}
