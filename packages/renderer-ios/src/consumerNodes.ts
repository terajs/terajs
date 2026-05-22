export type UIKitNativeNodeBase = {
  id: number;
  parent: UIKitNativeViewNode | null;
};

export type UIKitNativeTextNode = UIKitNativeNodeBase & {
  kind: "text";
  value: string;
};

export type UIKitNativeViewNode = UIKitNativeNodeBase & {
  children: UIKitNativeNode[];
  className: string;
  kind: "view";
  props: Record<string, unknown>;
  styles: Record<string, string>;
  subscribedEvents: string[];
  viewType: string;
};

export type UIKitNativeNode = UIKitNativeTextNode | UIKitNativeViewNode;

export function createUIKitNativeViewNode(nodeId: number, viewType: string): UIKitNativeViewNode {
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

export function createUIKitNativeTextNode(nodeId: number, value: string): UIKitNativeTextNode {
  return {
    id: nodeId,
    parent: null,
    kind: "text",
    value
  };
}

export function requireUIKitNativeNode(
  nodes: Map<number, UIKitNativeNode>,
  nodeId: number
): UIKitNativeNode {
  const node = nodes.get(nodeId);
  if (!node) {
    throw new Error(`Unknown UIKit native node ${nodeId}`);
  }

  return node;
}

export function requireUIKitNativeView(
  nodes: Map<number, UIKitNativeNode>,
  nodeId: number
): UIKitNativeViewNode {
  const node = requireUIKitNativeNode(nodes, nodeId);
  if (node.kind !== "view") {
    throw new Error(`Expected UIKit view node ${nodeId}`);
  }

  return node;
}

export function requireUIKitNativeText(
  nodes: Map<number, UIKitNativeNode>,
  nodeId: number
): UIKitNativeTextNode {
  const node = requireUIKitNativeNode(nodes, nodeId);
  if (node.kind !== "text") {
    throw new Error(`Expected UIKit text node ${nodeId}`);
  }

  return node;
}

export function detachUIKitNativeNode(node: UIKitNativeNode): void {
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

export function disposeUIKitNativeNode(
  node: UIKitNativeNode,
  nodes: Map<number, UIKitNativeNode>,
  clearRoot: (nodeId: number) => void
): void {
  if (node.kind === "view") {
    for (const child of [...node.children]) {
      disposeUIKitNativeNode(child, nodes, clearRoot);
    }

    node.children.length = 0;
    node.subscribedEvents = [];
  }

  detachUIKitNativeNode(node);
  nodes.delete(node.id);
  clearRoot(node.id);
}

export function insertUIKitNativeChild(
  parent: UIKitNativeViewNode,
  child: UIKitNativeNode,
  anchorId: number | null
): void {
  detachUIKitNativeNode(child);

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