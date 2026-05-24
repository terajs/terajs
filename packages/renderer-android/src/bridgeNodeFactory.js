import { createAndroidBridgeNodeBase, } from "./bridgeNodes.js";
export function createAndroidBridgeNodeFactory(options) {
    const { nodes, pushCommand } = options;
    let nextNodeId = 1;
    function createBaseNode(kind) {
        return createAndroidBridgeNodeBase(nextNodeId++, kind);
    }
    function createAnchorNode(label = "") {
        const node = {
            ...createBaseNode("anchor"),
            label
        };
        nodes.set(node.id, node);
        return node;
    }
    function createElementNode(viewType, svg) {
        const node = {
            ...createBaseNode("element"),
            viewType,
            svg,
            className: "",
            eventHandlers: {},
            props: {},
            styles: {}
        };
        pushCommand({
            type: "create-element",
            nodeId: node.id,
            viewType,
            svg
        });
        nodes.set(node.id, node);
        return node;
    }
    function createFragmentNode() {
        const node = {
            ...createBaseNode("fragment")
        };
        nodes.set(node.id, node);
        return node;
    }
    function createTextNode(value) {
        const node = {
            ...createBaseNode("text"),
            value: String(value)
        };
        pushCommand({
            type: "create-text",
            nodeId: node.id,
            value: node.value
        });
        nodes.set(node.id, node);
        return node;
    }
    return {
        createAnchorNode,
        createElementNode,
        createFragmentNode,
        createTextNode
    };
}
