import type { IRModule } from "@terajs/compiler";

import type { UIKitNativeViewNode } from "./consumer.js";
import { createUIKitHostSession } from "./session.js";
import type { UIKitHostSession, UIKitMountedModule } from "./session.js";

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