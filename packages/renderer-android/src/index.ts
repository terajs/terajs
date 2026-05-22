import type { IRModule } from "@terajs/compiler";
import type { RendererHost } from "@terajs/renderer";
import { createAndroidHostSession } from "./session.js";
import type { AndroidHostSession, AndroidMountedModule } from "./session.js";
import type { AndroidNativeViewNode } from "./consumer.js";

export {
  createAndroidCommandBridge,
  type AndroidBridgeCommand,
  type AndroidBridgeElementNode,
  type AndroidBridgeNode,
  type AndroidBridgeTextNode,
  type AndroidCommandBridge,
  type CreateAndroidCommandBridgeOptions
} from "./bridge.js";
export {
  createAndroidCommandConsumer,
  type AndroidCommandConsumer,
  type AndroidNativeNode,
  type AndroidNativeTextNode,
  type AndroidNativeViewNode
} from "./consumer.js";
export {
  createAndroidHostSession,
  type AndroidHostSession,
  type AndroidMountedModule
} from "./session.js";

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

export interface AndroidRenderResult {
  mounted: AndroidMountedModule;
  root: AndroidNativeViewNode;
  session: AndroidHostSession;
  unmount(): void;
}

/**
 * Renders compiler-generated IR into the package-local Android host session and
 * returns the native root plus a teardown handle for the mounted subtree.
 */
export function renderTerajsToAndroidViews(
  ir: IRModule,
  ctx: any,
  session: AndroidHostSession = createAndroidHostSession()
): AndroidRenderResult {
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
