import type { RendererHost } from "@terajs/renderer";

import {
  createAndroidBridgeNodeBase,
  detachAndroidBridgeNode,
  disposeAndroidBridgeSubtree,
  isAndroidNativeBackedNode,
  resolveAndroidBridgeAnchorId,
  type AndroidBridgeAnchorNode,
  type AndroidBridgeElementNode,
  type AndroidBridgeFragmentNode,
  type AndroidBridgeNode,
  type AndroidBridgeTextNode,
} from "./bridgeNodes.js";
import {
  type AndroidBridgeCommand,
  type AndroidCommandBridge,
  type CreateAndroidCommandBridgeOptions,
} from "./bridgeContracts.js";
import { normalizeAndroidEventName, normalizeAndroidProp, resolveAndroidViewType } from "./primitives.js";
import { normalizeAndroidStyle } from "./styleNormalization.js";

export type {
  AndroidBridgeCommand,
  AndroidCommandBridge,
  CreateAndroidCommandBridgeOptions,
} from "./bridgeContracts.js";
export type {
  AndroidBridgeAnchorNode,
  AndroidBridgeElementNode,
  AndroidBridgeFragmentNode,
  AndroidBridgeNode,
  AndroidBridgeTextNode,
} from "./bridgeNodes.js";

/**
 * Creates a thin command-oriented Android bridge that keeps renderer ownership in JS
 * and emits only host operations plus event subscription state toward native.
 */
export function createAndroidCommandBridge(
  options: CreateAndroidCommandBridgeOptions = {}
): AndroidCommandBridge {
  const commands: AndroidBridgeCommand[] = [];
  const emitCommand = options.emitCommand;
  const nodes = new Map<number, AndroidBridgeNode>();
  let nextNodeId = 1;

  function pushCommand(command: AndroidBridgeCommand): void {
    commands.push(command);
    emitCommand?.(command);
  }

  function createBaseNode<Kind extends AndroidBridgeNode["kind"]>(kind: Kind) {
    return createAndroidBridgeNodeBase(nextNodeId++, kind);
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

  const host: RendererHost<
    AndroidBridgeNode,
    AndroidBridgeElementNode,
    AndroidBridgeTextNode,
    AndroidBridgeFragmentNode
  > = {
    createAnchor(label = "") {
      const node: AndroidBridgeAnchorNode = {
        ...createBaseNode("anchor"),
        label
      };

      nodes.set(node.id, node);
      return node;
    },
    createElement(type, svg = false) {
      return createElementNode(resolveAndroidViewType(type), svg);
    },
    createText(value) {
      return createTextNode(value);
    },
    createFragment() {
      const node: AndroidBridgeFragmentNode = {
        ...createBaseNode("fragment")
      };

      nodes.set(node.id, node);
      return node;
    },
    isNode(value): value is AndroidBridgeNode {
      return typeof value === "object" && value !== null && "kind" in value && "id" in value;
    },
    isFragment(node): node is AndroidBridgeFragmentNode {
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

      const anchorId = resolveAndroidBridgeAnchorId(parent, anchor);

      detachAndroidBridgeNode(child);

      const anchorIndex = anchor ? parent.children.indexOf(anchor) : -1;
      if (anchorIndex >= 0) {
        parent.children.splice(anchorIndex, 0, child);
      } else {
        parent.children.push(child);
      }

      child.parent = parent;

      if (isAndroidNativeBackedNode(parent) && isAndroidNativeBackedNode(child)) {
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
        nodes.delete(node.id);
        return;
      }

      disposeAndroidBridgeSubtree(node, nodes);
      detachAndroidBridgeNode(node);

      if (isAndroidNativeBackedNode(node)) {
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
      const normalized = normalizeAndroidProp(el.viewType, name, value);

      if (normalized.value == null) {
        delete el.props[normalized.name];
      } else {
        el.props[normalized.name] = normalized.value;
      }

      pushCommand({
        type: "set-prop",
        nodeId: el.id,
        name: normalized.name,
        value: normalized.value ?? null
      });
    },
    setStyle(el, style) {
      const normalizedStyle = normalizeAndroidStyle(el.viewType, style);

      el.styles = {
        ...el.styles,
        ...normalizedStyle
      };

      pushCommand({
        type: "set-style",
        nodeId: el.id,
        style: normalizedStyle
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
      const nativeEventName = normalizeAndroidEventName(el.viewType, name);
      const handlers = el.eventHandlers[nativeEventName] ?? [];
      const shouldSubscribe = handlers.length === 0;

      handlers.push(handler);
      el.eventHandlers[nativeEventName] = handlers;

      if (shouldSubscribe) {
        pushCommand({
          type: "subscribe-event",
          nodeId: el.id,
          name: nativeEventName
        });
      }
    },
    removeEvent(el, name, handler) {
      const nativeEventName = normalizeAndroidEventName(el.viewType, name);
      const current = el.eventHandlers[nativeEventName];
      if (!current?.length) {
        return;
      }

      const nextHandlers = current.filter((candidate) => candidate !== handler);
      if (nextHandlers.length > 0) {
        el.eventHandlers[nativeEventName] = nextHandlers;
        return;
      }

      delete el.eventHandlers[nativeEventName];
      pushCommand({
        type: "unsubscribe-event",
        nodeId: el.id,
        name: nativeEventName
      });
    },
    addNodeCleanup(node, cleanup) {
      node.cleanups.push(cleanup);
    }
  };

  const root = createElementNode(options.rootViewType ?? "ViewGroup", false);

  return {
    commands,
    dispatchEvent(node, name, payload) {
      for (const handler of [...(node.eventHandlers[name] ?? [])]) {
        handler(payload);
      }
    },
    getNode(nodeId) {
      return nodes.get(nodeId);
    },
    host,
    root
  };
}