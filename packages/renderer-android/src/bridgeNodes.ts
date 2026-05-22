import type { RendererEventHandler } from "@terajs/renderer";

type AndroidBridgeNodeBase = {
  children: AndroidBridgeNode[];
  cleanups: Array<() => void>;
  id: number;
  kind: string;
  parent: AndroidBridgeNode | null;
};

export type AndroidBridgeAnchorNode = AndroidBridgeNodeBase & {
  kind: "anchor";
  label: string;
};

export type AndroidBridgeElementNode = AndroidBridgeNodeBase & {
  className: string;
  eventHandlers: Record<string, RendererEventHandler[]>;
  kind: "element";
  props: Record<string, unknown>;
  styles: Record<string, string>;
  svg: boolean;
  viewType: string;
};

export type AndroidBridgeFragmentNode = AndroidBridgeNodeBase & {
  kind: "fragment";
};

export type AndroidBridgeTextNode = AndroidBridgeNodeBase & {
  kind: "text";
  value: string;
};

export type AndroidBridgeNode =
  | AndroidBridgeAnchorNode
  | AndroidBridgeElementNode
  | AndroidBridgeFragmentNode
  | AndroidBridgeTextNode;

export function createAndroidBridgeNodeBase<Kind extends AndroidBridgeNode["kind"]>(
  id: number,
  kind: Kind
): AndroidBridgeNodeBase & { kind: Kind } {
  return {
    kind,
    id,
    parent: null,
    children: [],
    cleanups: []
  } as AndroidBridgeNodeBase & { kind: Kind };
}

export function isAndroidNativeBackedNode(
  node: AndroidBridgeNode
): node is AndroidBridgeElementNode | AndroidBridgeTextNode {
  return node.kind === "element" || node.kind === "text";
}

export function detachAndroidBridgeNode(node: AndroidBridgeNode): void {
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

export function disposeAndroidBridgeSubtree(
  node: AndroidBridgeNode,
  nodes: Map<number, AndroidBridgeNode>
): void {
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

export function resolveAndroidBridgeAnchorId(
  parent: AndroidBridgeNode,
  anchor: AndroidBridgeNode | null | undefined
): number | null {
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