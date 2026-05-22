import type { RendererEventHandler } from "@terajs/renderer";

type UIKitBridgeNodeBase = {
  children: UIKitBridgeNode[];
  cleanups: Array<() => void>;
  id: number;
  kind: string;
  parent: UIKitBridgeNode | null;
};

export type UIKitBridgeAnchorNode = UIKitBridgeNodeBase & {
  kind: "anchor";
  label: string;
};

export type UIKitBridgeElementNode = UIKitBridgeNodeBase & {
  className: string;
  eventHandlers: Record<string, RendererEventHandler[]>;
  kind: "element";
  props: Record<string, unknown>;
  styles: Record<string, string>;
  svg: boolean;
  viewType: string;
};

export type UIKitBridgeFragmentNode = UIKitBridgeNodeBase & {
  kind: "fragment";
};

export type UIKitBridgeTextNode = UIKitBridgeNodeBase & {
  kind: "text";
  value: string;
};

export type UIKitBridgeNode =
  | UIKitBridgeAnchorNode
  | UIKitBridgeElementNode
  | UIKitBridgeFragmentNode
  | UIKitBridgeTextNode;

export function createUIKitBridgeNodeBase<Kind extends UIKitBridgeNode["kind"]>(
  id: number,
  kind: Kind
): UIKitBridgeNodeBase & { kind: Kind } {
  return {
    kind,
    id,
    parent: null,
    children: [],
    cleanups: []
  } as UIKitBridgeNodeBase & { kind: Kind };
}

export function isUIKitNativeBackedNode(
  node: UIKitBridgeNode
): node is UIKitBridgeElementNode | UIKitBridgeTextNode {
  return node.kind === "element" || node.kind === "text";
}

export function detachUIKitBridgeNode(node: UIKitBridgeNode): void {
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

export function disposeUIKitBridgeSubtree(
  node: UIKitBridgeNode,
  nodes: Map<number, UIKitBridgeNode>
): void {
  for (const child of [...node.children]) {
    disposeUIKitBridgeSubtree(child, nodes);
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

export function resolveUIKitBridgeAnchorId(
  parent: UIKitBridgeNode,
  anchor: UIKitBridgeNode | null | undefined
): number | null {
  if (!anchor) {
    return null;
  }

  const anchorIndex = parent.children.indexOf(anchor);
  if (anchorIndex === -1) {
    return isUIKitNativeBackedNode(anchor) ? anchor.id : null;
  }

  for (let index = anchorIndex; index < parent.children.length; index += 1) {
    const candidate = parent.children[index];
    if (isUIKitNativeBackedNode(candidate)) {
      return candidate.id;
    }
  }

  return null;
}