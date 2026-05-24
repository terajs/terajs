import type { IRModule } from "@terajs/compiler";
import type { AndroidNativeViewNode } from "./consumer.js";
import type { AndroidHostSession, AndroidMountedModule } from "./session.js";
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
export declare function renderTerajsToAndroidViews(ir: IRModule, ctx: any, session?: AndroidHostSession): AndroidRenderResult;
//# sourceMappingURL=render.d.ts.map