export function createAndroidNativeViewNode(nodeId, viewType) {
    return {
        id: nodeId,
        parent: null,
        kind: "view",
        viewType,
        className: "",
        children: [],
        props: {},
        styles: {},
        subscribedEvents: []
    };
}
export function createAndroidNativeTextNode(nodeId, value) {
    return {
        id: nodeId,
        parent: null,
        kind: "text",
        value
    };
}
export function requireAndroidNativeNode(nodes, nodeId) {
    const node = nodes.get(nodeId);
    if (!node) {
        throw new Error(`Unknown Android native node ${nodeId}`);
    }
    return node;
}
export function requireAndroidNativeView(nodes, nodeId) {
    const node = requireAndroidNativeNode(nodes, nodeId);
    if (node.kind !== "view") {
        throw new Error(`Expected Android view node ${nodeId}`);
    }
    return node;
}
export function requireAndroidNativeText(nodes, nodeId) {
    const node = requireAndroidNativeNode(nodes, nodeId);
    if (node.kind !== "text") {
        throw new Error(`Expected Android text node ${nodeId}`);
    }
    return node;
}
export function detachAndroidNativeNode(node) {
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
export function disposeAndroidNativeNode(node, nodes, clearRoot) {
    if (node.kind === "view") {
        for (const child of [...node.children]) {
            disposeAndroidNativeNode(child, nodes, clearRoot);
        }
        node.children.length = 0;
        node.subscribedEvents = [];
    }
    detachAndroidNativeNode(node);
    nodes.delete(node.id);
    clearRoot(node.id);
}
export function insertAndroidNativeChild(parent, child, anchorId) {
    detachAndroidNativeNode(child);
    if (anchorId != null) {
        const anchorIndex = parent.children.findIndex((candidate) => candidate.id === anchorId);
        if (anchorIndex !== -1) {
            parent.children.splice(anchorIndex, 0, child);
            child.parent = parent;
            return;
        }
    }
    parent.children.push(child);
    child.parent = parent;
}
