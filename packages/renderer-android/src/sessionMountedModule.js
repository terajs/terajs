function getAndroidRemovalPriority(node) {
    return node.kind === "anchor" ? 0 : 1;
}
function removeAndroidBridgeNodes(bridge, nodes) {
    const orderedNodes = [...nodes].sort((left, right) => getAndroidRemovalPriority(left) - getAndroidRemovalPriority(right));
    for (const node of orderedNodes) {
        if (!bridge.getNode(node.id)) {
            continue;
        }
        bridge.host.remove(node);
    }
}
export function createAndroidMountedModule(bridge, nodes) {
    let removed = false;
    return {
        bridgeNodes: [...nodes],
        remove() {
            if (removed) {
                return;
            }
            removed = true;
            removeAndroidBridgeNodes(bridge, nodes);
        }
    };
}
