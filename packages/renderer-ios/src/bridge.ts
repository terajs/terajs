import type { RendererEventHandler, RendererHost } from "@terajs/renderer";

export type UIKitBridgeCommand =
  | {
    type: "create-element";
    nodeId: number;
    viewType: string;
    svg: boolean;
  }
  | {
    type: "create-text";
    nodeId: number;
    value: string;
  }
  | {
    type: "insert";
    parentId: number;
    childId: number;
    anchorId: number | null;
  }
  | {
    type: "remove";
    nodeId: number;
  }
  | {
    type: "set-text";
    nodeId: number;
    value: string;
  }
  | {
    type: "set-prop";
    nodeId: number;
    name: string;
    value: unknown;
  }
  | {
    type: "set-style";
    nodeId: number;
    style: Record<string, string>;
  }
  | {
    type: "set-class";
    nodeId: number;
    className: string;
  }
  | {
    type: "subscribe-event";
    nodeId: number;
    name: string;
  }
  | {
    type: "unsubscribe-event";
    nodeId: number;
    name: string;
  };

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

export interface CreateUIKitCommandBridgeOptions {
  emitCommand?: (command: UIKitBridgeCommand) => void;
  rootViewType?: string;
}

export interface UIKitCommandBridge {
  readonly commands: UIKitBridgeCommand[];
  dispatchEvent(node: UIKitBridgeElementNode, name: string, payload?: unknown): void;
  host: RendererHost<
    UIKitBridgeNode,
    UIKitBridgeElementNode,
    UIKitBridgeTextNode,
    UIKitBridgeFragmentNode
  >;
  root: UIKitBridgeElementNode;
}

/**
 * Creates a thin command-oriented UIKit bridge that keeps renderer ownership in JS
 * and emits only host operations plus event subscription state toward native.
 */
export function createUIKitCommandBridge(
  options: CreateUIKitCommandBridgeOptions = {}
): UIKitCommandBridge {
  const commands: UIKitBridgeCommand[] = [];
  const emitCommand = options.emitCommand;
  let nextNodeId = 1;

  function pushCommand(command: UIKitBridgeCommand): void {
    commands.push(command);
    emitCommand?.(command);
  }

  function createBaseNode<Kind extends UIKitBridgeNode["kind"]>(kind: Kind): UIKitBridgeNodeBase & { kind: Kind } {
    return {
      kind,
      id: nextNodeId++,
      parent: null,
      children: [],
      cleanups: []
    } as UIKitBridgeNodeBase & { kind: Kind };
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

    return node;
  }

  function isNativeBackedNode(node: UIKitBridgeNode): node is UIKitBridgeElementNode | UIKitBridgeTextNode {
    return node.kind === "element" || node.kind === "text";
  }

  function detach(node: UIKitBridgeNode): void {
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

  function disposeSubtree(node: UIKitBridgeNode): void {
    for (const child of [...node.children]) {
      disposeSubtree(child);
      child.parent = null;
    }

    node.children.length = 0;

    for (const cleanup of node.cleanups.splice(0, node.cleanups.length)) {
      cleanup();
    }

    if (node.kind === "element") {
      node.eventHandlers = {};
    }
  }

  function resolveAnchorId(parent: UIKitBridgeNode, anchor: UIKitBridgeNode | null | undefined): number | null {
    if (!anchor) {
      return null;
    }

    const anchorIndex = parent.children.indexOf(anchor);
    if (anchorIndex === -1) {
      return isNativeBackedNode(anchor) ? anchor.id : null;
    }

    for (let index = anchorIndex; index < parent.children.length; index += 1) {
      const candidate = parent.children[index];
      if (isNativeBackedNode(candidate)) {
        return candidate.id;
      }
    }

    return null;
  }

  const host: RendererHost<
    UIKitBridgeNode,
    UIKitBridgeElementNode,
    UIKitBridgeTextNode,
    UIKitBridgeFragmentNode
  > = {
    createAnchor(label = "") {
      return {
        ...createBaseNode("anchor"),
        label
      };
    },
    createElement(type, svg = false) {
      return createElementNode(type, svg);
    },
    createText(value) {
      return createTextNode(value);
    },
    createFragment() {
      return {
        ...createBaseNode("fragment")
      };
    },
    isNode(value): value is UIKitBridgeNode {
      return typeof value === "object" && value !== null && "kind" in value && "id" in value;
    },
    isFragment(node): node is UIKitBridgeFragmentNode {
      return node.kind === "fragment";
    },
    getParent(node) {
      return node.parent;
    },
    getNextSibling(node) {
      const parent = node.parent;
      if (!parent) {
        return null;
      }

      const index = parent.children.indexOf(node);
      return index >= 0 ? parent.children[index + 1] ?? null : null;
    },
    getChildren(node) {
      return [...node.children];
    },
    insert(parent, child, anchor = null) {
      if (child.kind === "fragment") {
        const fragmentChildren = [...child.children];
        child.children.length = 0;
        for (const fragmentChild of fragmentChildren) {
          this.insert(parent, fragmentChild, anchor);
        }
        return;
      }

      const anchorId = resolveAnchorId(parent, anchor);

      detach(child);

      const anchorIndex = anchor ? parent.children.indexOf(anchor) : -1;
      if (anchorIndex >= 0) {
        parent.children.splice(anchorIndex, 0, child);
      } else {
        parent.children.push(child);
      }

      child.parent = parent;

      if (isNativeBackedNode(parent) && isNativeBackedNode(child)) {
        pushCommand({
          type: "insert",
          parentId: parent.id,
          childId: child.id,
          anchorId
        });
      }
    },
    remove(node) {
      if (node.kind === "fragment") {
        for (const child of [...node.children]) {
          this.remove(child);
        }
        return;
      }

      disposeSubtree(node);
      detach(node);

      if (isNativeBackedNode(node)) {
        pushCommand({
          type: "remove",
          nodeId: node.id
        });
      }
    },
    setText(node, value) {
      node.value = String(value);
      pushCommand({
        type: "set-text",
        nodeId: node.id,
        value: node.value
      });
    },
    setProp(el, name, value) {
      if (value == null) {
        delete el.props[name];
      } else {
        el.props[name] = value;
      }

      pushCommand({
        type: "set-prop",
        nodeId: el.id,
        name,
        value: value ?? null
      });
    },
    setStyle(el, style) {
      el.styles = {
        ...el.styles,
        ...style
      };

      pushCommand({
        type: "set-style",
        nodeId: el.id,
        style
      });
    },
    setClass(el, className) {
      el.className = className;
      pushCommand({
        type: "set-class",
        nodeId: el.id,
        className
      });
    },
    addEvent(el, name, handler) {
      const handlers = el.eventHandlers[name] ?? [];
      const shouldSubscribe = handlers.length === 0;

      handlers.push(handler);
      el.eventHandlers[name] = handlers;

      if (shouldSubscribe) {
        pushCommand({
          type: "subscribe-event",
          nodeId: el.id,
          name
        });
      }
    },
    removeEvent(el, name, handler) {
      const current = el.eventHandlers[name];
      if (!current?.length) {
        return;
      }

      const nextHandlers = current.filter((candidate) => candidate !== handler);
      if (nextHandlers.length > 0) {
        el.eventHandlers[name] = nextHandlers;
        return;
      }

      delete el.eventHandlers[name];
      pushCommand({
        type: "unsubscribe-event",
        nodeId: el.id,
        name
      });
    },
    addNodeCleanup(node, cleanup) {
      node.cleanups.push(cleanup);
    }
  };

  const root = createElementNode(options.rootViewType ?? "UIView", false);

  return {
    commands,
    dispatchEvent(node, name, payload) {
      for (const handler of [...(node.eventHandlers[name] ?? [])]) {
        handler(payload);
      }
    },
    host,
    root
  };
}