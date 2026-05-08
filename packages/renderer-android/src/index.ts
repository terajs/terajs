import type { RendererHost } from "@terajs/renderer";

type AndroidViewHostNode = {
  type: string;
  props: Record<string, unknown>;
  children: AndroidViewHostNode[];
  parent: AndroidViewHostNode | null;
};

export type AndroidViewHostAdapter = Pick<
  RendererHost<AndroidViewHostNode>,
  "createElement" | "insert" | "remove" | "setProp"
>;

export const AndroidViewAdapter: AndroidViewHostAdapter = {
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

export function renderTerajsToAndroidViews(component: any, adapter: AndroidViewHostAdapter = AndroidViewAdapter) {
  void component;
  return adapter.createElement("ViewGroup");
}
