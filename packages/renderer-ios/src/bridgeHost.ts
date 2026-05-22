import type { RendererHost } from "@terajs/renderer";

import type { UIKitBridgeCommand } from "./bridgeContracts.js";
import { createUIKitBridgeNodeFactory } from "./bridgeNodeFactory.js";
import {
  detachUIKitBridgeNode,
  disposeUIKitBridgeSubtree,
  isUIKitNativeBackedNode,
  resolveUIKitBridgeAnchorId,
  type UIKitBridgeElementNode,
  type UIKitBridgeFragmentNode,
  type UIKitBridgeNode,
  type UIKitBridgeTextNode,
} from "./bridgeNodes.js";
import { normalizeUIKitEventName, normalizeUIKitProp, resolveUIKitViewType } from "./primitives.js";
import { normalizeUIKitStyle } from "./styleNormalization.js";

interface CreateUIKitBridgeHostOptions {
  nodes: Map<number, UIKitBridgeNode>;
  pushCommand(command: UIKitBridgeCommand): void;
  rootViewType?: string;
}

export function createUIKitBridgeHost(options: CreateUIKitBridgeHostOptions): {
  host: RendererHost<
    UIKitBridgeNode,
    UIKitBridgeElementNode,
    UIKitBridgeTextNode,
    UIKitBridgeFragmentNode
  >;
  root: UIKitBridgeElementNode;
} {
  const { nodes, pushCommand } = options;
  const {
    createAnchorNode,
    createElementNode,
    createFragmentNode,
    createTextNode
  } = createUIKitBridgeNodeFactory({ nodes, pushCommand });

  const host: RendererHost<
    UIKitBridgeNode,
    UIKitBridgeElementNode,
    UIKitBridgeTextNode,
    UIKitBridgeFragmentNode
  > = {
    createAnchor(label = "") {
      return createAnchorNode(label);
    },
    createElement(type, svg = false) {
      return createElementNode(resolveUIKitViewType(type), svg);
    },
    createText(value) {
      return createTextNode(value);
    },
    createFragment() {
      return createFragmentNode();
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

      const anchorId = resolveUIKitBridgeAnchorId(parent, anchor);

      detachUIKitBridgeNode(child);

      const anchorIndex = anchor ? parent.children.indexOf(anchor) : -1;
      if (anchorIndex >= 0) {
        parent.children.splice(anchorIndex, 0, child);
      } else {
        parent.children.push(child);
      }

      child.parent = parent;

      if (isUIKitNativeBackedNode(parent) && isUIKitNativeBackedNode(child)) {
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

      disposeUIKitBridgeSubtree(node, nodes);
      detachUIKitBridgeNode(node);

      if (isUIKitNativeBackedNode(node)) {
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
      const normalized = normalizeUIKitProp(el.viewType, name, value);

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
      const normalizedStyle = normalizeUIKitStyle(el.viewType, style);

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
      const nativeEventName = normalizeUIKitEventName(el.viewType, name);
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
      const nativeEventName = normalizeUIKitEventName(el.viewType, name);
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

  const root = createElementNode(options.rootViewType ?? "UIView", false);

  return { host, root };
}