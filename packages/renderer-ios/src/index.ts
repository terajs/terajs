import type { RendererHost } from "@terajs/renderer";

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
 * Creates the current placeholder native root while the real JS-to-UIKit bridge
 * is still being built.
 */
export function renderTerajsToUIKitViews(component: any, adapter: UIKitHostAdapter = UIKitViewAdapter) {
  void component;
  return adapter.createElement("UIView");
}
