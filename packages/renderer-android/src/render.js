import { createAndroidHostSession } from "./session.js";
/**
 * Renders compiler-generated IR into the package-local Android host session and
 * returns the native root plus a teardown handle for the mounted subtree.
 */
export function renderTerajsToAndroidViews(ir, ctx, session = createAndroidHostSession()) {
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
