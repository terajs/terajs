import type { AndroidHostSession } from "./sessionContracts.js";
export type { AndroidHostSession, AndroidMountedModule } from "./sessionContracts.js";
/**
 * Creates a package-local Android host session that mounts compiler IR through the
 * neutral host renderer runtime and replays the resulting command stream into the
 * Android Views-shaped native tree owned by this package.
 */
export declare function createAndroidHostSession(): AndroidHostSession;
//# sourceMappingURL=session.d.ts.map