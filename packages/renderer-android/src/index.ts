import type { RendererHost } from "@terajs/renderer";

export {
  createAndroidCommandBridge,
  type AndroidBridgeCommand,
  type AndroidBridgeElementNode,
  type AndroidBridgeNode,
  type AndroidBridgeTextNode,
  type AndroidCommandBridge,
  type CreateAndroidCommandBridgeOptions
} from "./bridge.js";

type AndroidViewHostNode = {
  type: string;
  props: Record<string, unknown>;
  children: AndroidViewHostNode[];
  parent: AndroidViewHostNode | null;
};

/** Minimal imperative host surface for the current Android Views renderer stub. */
export type AndroidViewHostAdapter = Pick<
  RendererHost<AndroidViewHostNode>,
  "createElement" | "insert" | "remove" | "setProp"
>;

/** In-memory Android host used to validate the shared renderer contract from JS. */
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

/**
 * Creates the current placeholder native root while the renderer package grows
 * a full command-oriented bridge host for compiler-driven native proof.
 */
export function renderTerajsToAndroidViews(component: any, adapter: AndroidViewHostAdapter = AndroidViewAdapter) {
  void component;
  return adapter.createElement("ViewGroup");
}
