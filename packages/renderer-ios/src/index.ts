import type { IRModule } from "@terajs/compiler";
import type { RendererHost } from "@terajs/renderer";
import { normalizeUIKitProp, resolveUIKitViewType } from "./primitives.js";
import { createUIKitHostSession } from "./session.js";
import type { UIKitMountedModule, UIKitHostSession } from "./session.js";
import type { UIKitNativeViewNode } from "./consumer.js";

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
  type UIKitHostSession,
  type UIKitMountedModule
} from "./session.js";
export {
  normalizeUIKitEventName,
  normalizeUIKitProp,
  normalizeUIKitStyle,
  resolveUIKitViewType
} from "./primitives.js";

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

    if (normalized.value == null) {
      delete node.props[normalized.name];
      return;
    }

    node.props[normalized.name] = normalized.value;
  }
};

export interface UIKitRenderResult {
  mounted: UIKitMountedModule;
  root: UIKitNativeViewNode;
  session: UIKitHostSession;
  unmount(): void;
}

/**
 * Renders compiler-generated IR into the package-local UIKit host session and
 * returns the native root plus a teardown handle for the mounted subtree.
 */
export function renderTerajsToUIKitViews(
  ir: IRModule,
  ctx: any,
  session: UIKitHostSession = createUIKitHostSession()
): UIKitRenderResult {
  const mounted = session.mountIRModule(ir, ctx);

  return {
    mounted,
    root: session.root,
    session,
    unmount() {
      mounted.remove();
    }
  };
}
