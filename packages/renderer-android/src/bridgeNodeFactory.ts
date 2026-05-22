import type { AndroidBridgeCommand } from "./bridgeContracts.js";
import {
  createAndroidBridgeNodeBase,
  type AndroidBridgeAnchorNode,
  type AndroidBridgeElementNode,
  type AndroidBridgeFragmentNode,
  type AndroidBridgeNode,
  type AndroidBridgeTextNode,
} from "./bridgeNodes.js";

interface CreateAndroidBridgeNodeFactoryOptions {
  nodes: Map<number, AndroidBridgeNode>;
  pushCommand(command: AndroidBridgeCommand): void;
}

export function createAndroidBridgeNodeFactory(options: CreateAndroidBridgeNodeFactoryOptions): {
  createAnchorNode(label?: string): AndroidBridgeAnchorNode;
  createElementNode(viewType: string, svg: boolean): AndroidBridgeElementNode;
  createFragmentNode(): AndroidBridgeFragmentNode;
  createTextNode(value: string): AndroidBridgeTextNode;
} {
  const { nodes, pushCommand } = options;
  let nextNodeId = 1;

  function createBaseNode<Kind extends AndroidBridgeNode["kind"]>(kind: Kind) {
    return createAndroidBridgeNodeBase(nextNodeId++, kind);
  }

  function createAnchorNode(label = ""): AndroidBridgeAnchorNode {
    const node: AndroidBridgeAnchorNode = {
      ...createBaseNode("anchor"),
      label
    };

    nodes.set(node.id, node);
    return node;
  }

  function createElementNode(viewType: string, svg: boolean): AndroidBridgeElementNode {
    const node: AndroidBridgeElementNode = {
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

  function createFragmentNode(): AndroidBridgeFragmentNode {
    const node: AndroidBridgeFragmentNode = {
      ...createBaseNode("fragment")
    };

    nodes.set(node.id, node);
    return node;
  }

  function createTextNode(value: string): AndroidBridgeTextNode {
    const node: AndroidBridgeTextNode = {
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