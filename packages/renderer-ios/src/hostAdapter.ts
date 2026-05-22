import type { RendererHost } from "@terajs/renderer";

import { normalizeUIKitProp, resolveUIKitViewType } from "./primitives.js";

export type UIKitHostNode = {
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
      type: resolveUIKitViewType(type),
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
    const normalized = normalizeUIKitProp(node.type, key, value);
    const updates = [normalized, ...(normalized.additional ?? [])];

    for (const update of updates) {
      if (update.value == null) {
        delete node.props[update.name];
        continue;
      }

      node.props[update.name] = update.value;
    }
  }
};