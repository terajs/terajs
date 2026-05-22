import type { UIKitBridgeCommand } from "./bridgeContracts.js";
import {
  createUIKitBridgeNodeBase,
  type UIKitBridgeAnchorNode,
  type UIKitBridgeElementNode,
  type UIKitBridgeFragmentNode,
  type UIKitBridgeNode,
  type UIKitBridgeTextNode,
} from "./bridgeNodes.js";

interface CreateUIKitBridgeNodeFactoryOptions {
  nodes: Map<number, UIKitBridgeNode>;
  pushCommand(command: UIKitBridgeCommand): void;
}

export function createUIKitBridgeNodeFactory(options: CreateUIKitBridgeNodeFactoryOptions): {
  createAnchorNode(label?: string): UIKitBridgeAnchorNode;
  createElementNode(viewType: string, svg: boolean): UIKitBridgeElementNode;
  createFragmentNode(): UIKitBridgeFragmentNode;
  createTextNode(value: string): UIKitBridgeTextNode;
} {
  const { nodes, pushCommand } = options;
  let nextNodeId = 1;

  function createBaseNode<Kind extends UIKitBridgeNode["kind"]>(kind: Kind) {
    return createUIKitBridgeNodeBase(nextNodeId++, kind);
  }

  function createAnchorNode(label = ""): UIKitBridgeAnchorNode {
    const node: UIKitBridgeAnchorNode = {
      ...createBaseNode("anchor"),
      label
    };

    nodes.set(node.id, node);
    return node;
  }

  function createElementNode(viewType: string, svg: boolean): UIKitBridgeElementNode {
    const node: UIKitBridgeElementNode = {
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

  function createFragmentNode(): UIKitBridgeFragmentNode {
    const node: UIKitBridgeFragmentNode = {
      ...createBaseNode("fragment")
    };

    nodes.set(node.id, node);
    return node;
  }

  function createTextNode(value: string): UIKitBridgeTextNode {
    const node: UIKitBridgeTextNode = {
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