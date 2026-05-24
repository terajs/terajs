/**
 * @file runtime.ts
 * @description
 * Tracks whether Terajs is running in client or server mode.
 *
 * Server mode disables effect execution and DOM writes,
 * but still allows dependency tracking for hydration.
 */
/**
 * Represents the current execution environment for the reactive runtime.
 */
export type RuntimeMode = "client" | "server";
/**
 * Sets the current runtime mode.
 *
 * @param mode - The runtime mode to activate.
 */
export declare function setRuntimeMode(mode: RuntimeMode): void;
/**
 * Returns `true` when the runtime is operating in server-side rendering mode.
 *
 * @returns Whether the runtime is currently in server mode.
 */
export declare function isServer(): boolean;
//# sourceMappingURL=runtime.d.ts.map