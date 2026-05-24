export function createAndroidBridgeNodeBase(id, kind) {
    return {
        kind,
        id,
        parent: null,
        children: [],
        cleanups: []
    };
}
export function isAndroidNativeBackedNode(node) {
    return node.kind === "element" || node.kind === "text";
}
export function detachAndroidBridgeNode(node) {
    const parent = node.parent;
    if (!parent) {
        return;
    }
    const index = parent.children.indexOf(node);
    if (index !== -1) {
        parent.children.splice(index, 1);
    }
    node.parent = null;
}
export function disposeAndroidBridgeSubtree(node, nodes) {
    for (const child of [...node.children]) {
        disposeAndroidBridgeSubtree(child, nodes);
        child.parent = null;
    }
    node.children.length = 0;
    for (const cleanup of node.cleanups.splice(0, node.cleanups.length)) {
        cleanup();
    }
    if (node.kind === "element") {
        node.eventHandlers = {};
    }
    nodes.delete(node.id);
}
export function resolveAndroidBridgeAnchorId(parent, anchor) {
    if (!anchor) {
        return null;
    }
    const anchorIndex = parent.children.indexOf(anchor);
    if (anchorIndex === -1) {
        return isAndroidNativeBackedNode(anchor) ? anchor.id : null;
    }
    for (let index = anchorIndex; index < parent.children.length; index += 1) {
        const candidate = parent.children[index];
        if (isAndroidNativeBackedNode(candidate)) {
            return candidate.id;
        }
    }
    return null;
}
