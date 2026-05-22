import type { RendererHost } from "@terajs/renderer";

export {
  createUIKitCommandBridge,
  type CreateUIKitCommandBridgeOptions,
  type UIKitBridgeCommand,
  type UIKitBridgeElementNode,
  type UIKitBridgeNode,
  type UIKitBridgeTextNode,
  type UIKitCommandBridge
} from "./bridge.js";
export {
  createUIKitCommandConsumer,
  type UIKitCommandConsumer,
  type UIKitNativeNode,
  type UIKitNativeTextNode,
  type UIKitNativeViewNode
} from "./consumer.js";
export {
  createUIKitHostSession,
  type UIKitHostSession
} from "./session.js";

type UIKitHostNode = {
  type: string;
  props: Record<string, unknown>;
  children: UIKitHostNode[];
  parent: UIKitHostNode | null;
};

/** Minimal imperative host surface for the current UIKit-side renderer stub. */
export type UIKitHostAdapter = Pick<
  RendererHost<UIKitHostNode>,
  "createElement" | "insert" | "remove" | "setProp"
>;

/** In-memory UIKit host used to validate the shared renderer contract from JS. */
export const UIKitViewAdapter: UIKitHostAdapter = {
  createElement(type) {
    return {
      type,
      props: {},
      children: [],
      parent: null
    };
  },
  insert(parent, child) {
    child.parent = parent;
    parent.children.push(child);
  },
  remove(node) {
    const parent = node.parent;
    if (!parent) {
      return;
    }

    parent.children = parent.children.filter((child) => child !== node);
    node.parent = null;
  },
  setProp(node, key, value) {
    node.props[key] = value;
  }
};

/**
 * Creates the current placeholder native root while the renderer package grows
 * a full command-oriented bridge host for compiler-driven native proof.
 */
export function renderTerajsToUIKitViews(component: any, adapter: UIKitHostAdapter = UIKitViewAdapter) {
  void component;
  return adapter.createElement("UIView");
}
