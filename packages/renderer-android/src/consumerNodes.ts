export type AndroidNativeNodeBase = {
  id: number;
  parent: AndroidNativeViewNode | null;
};

export type AndroidNativeTextNode = AndroidNativeNodeBase & {
  kind: "text";
  value: string;
};

export type AndroidNativeViewNode = AndroidNativeNodeBase & {
  children: AndroidNativeNode[];
  className: string;
  kind: "view";
  props: Record<string, unknown>;
  styles: Record<string, string>;
  subscribedEvents: string[];
  viewType: string;
};

export type AndroidNativeNode = AndroidNativeTextNode | AndroidNativeViewNode;

export function createAndroidNativeViewNode(nodeId: number, viewType: string): AndroidNativeViewNode {
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

export function createAndroidNativeTextNode(nodeId: number, value: string): AndroidNativeTextNode {
  return {
    id: nodeId,
    parent: null,
    kind: "text",
    value
  };
}

export function requireAndroidNativeNode(
  nodes: Map<number, AndroidNativeNode>,
  nodeId: number
): AndroidNativeNode {
  const node = nodes.get(nodeId);
  if (!node) {
    throw new Error(`Unknown Android native node ${nodeId}`);
  }

  return node;
}

export function requireAndroidNativeView(
  nodes: Map<number, AndroidNativeNode>,
  nodeId: number
): AndroidNativeViewNode {
  const node = requireAndroidNativeNode(nodes, nodeId);
  if (node.kind !== "view") {
    throw new Error(`Expected Android view node ${nodeId}`);
  }

  return node;
}

export function requireAndroidNativeText(
  nodes: Map<number, AndroidNativeNode>,
  nodeId: number
): AndroidNativeTextNode {
  const node = requireAndroidNativeNode(nodes, nodeId);
  if (node.kind !== "text") {
    throw new Error(`Expected Android text node ${nodeId}`);
  }

  return node;
}

export function detachAndroidNativeNode(node: AndroidNativeNode): void {
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

export function disposeAndroidNativeNode(
  node: AndroidNativeNode,
  nodes: Map<number, AndroidNativeNode>,
  clearRoot: (nodeId: number) => void
): void {
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

export function insertAndroidNativeChild(
  parent: AndroidNativeViewNode,
  child: AndroidNativeNode,
  anchorId: number | null
): void {
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