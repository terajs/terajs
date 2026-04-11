/**
 * @file runtime.ts
 * @description
 * Tracks whether Terajs is running in client or server mode.
 *
 * Server mode disables effect execution and DOM writes,
 * but still allows dependency tracking for hydration.
 */

import { Debug } from "@terajs/shared";

/**
 * Represents the current execution environment for the reactive runtime.
 */
export type RuntimeMode = "client" | "server";

let runtimeMode: RuntimeMode = "client";

/**
 * Sets the current runtime mode.
 *
 * @param mode - The runtime mode to activate.
 */
export function setRuntimeMode(mode: RuntimeMode): void {
    const prev = runtimeMode;
    runtimeMode = mode;

    Debug.emit("runtime:mode:set", {
        previous: prev,
        next: mode
    });
}

/**
 * Returns `true` when the runtime is operating in server-side rendering mode.
 *
 * @returns Whether the runtime is currently in server mode.
 */
export function isServer(): boolean {
    const result = runtimeMode === "server";

    Debug.emit("runtime:mode:check", {
        mode: runtimeMode,
        isServer: result
    });

    return result;
}
