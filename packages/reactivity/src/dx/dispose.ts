/**
 * @file dispose.ts
 * @description
 * Disposes of a reactive effect, unsubscribing it from all dependencies
 * and preventing future executions.
 *
 * This is essential for:
 * - component unmounting
 * - stopping watchers
 * - preventing ghost updates
 * - avoiding memory leaks
 */

import { type ReactiveEffect } from "../deps.js";
import { Debug } from "@terajs/shared";
import { debugInstrumentationEnabled } from "../debugRuntime.js";

/**
 * Disposes of a reactive effect.
 *
 * Steps:
 * 1. Run cleanup functions
 * 2. Remove effect from all dependency sets
 * 3. Mark effect as inactive
 *
 * @param effectFn - The ReactiveEffect to dispose.
 */
export function dispose(effectFn: ReactiveEffect): void {
    if (debugInstrumentationEnabled) {
        Debug.emit("effect:dispose:start", {
            effect: effectFn
        });
    }

    // 1. Run cleanup functions
    if (effectFn.cleanups.length) {
        if (debugInstrumentationEnabled) {
            Debug.emit("effect:dispose:cleanup", {
                effect: effectFn,
                count: effectFn.cleanups.length
            });
        }

        for (const cleanup of effectFn.cleanups) {
            try {
                cleanup();
            } catch {
                // swallow user cleanup errors to ensure disposal continues
            }
        }

        effectFn.cleanups.length = 0;
    }

    // 2. Remove from dependency sets
    if (effectFn.deps.length) {
        if (debugInstrumentationEnabled) {
            Debug.emit("effect:dispose:deps", {
                effect: effectFn,
                count: effectFn.deps.length
            });
        }

        for (const dep of effectFn.deps) {
            dep.delete(effectFn);
        }

        effectFn.deps.length = 0;
    }

    // 3. Mark inactive
    effectFn.active = false;

    if (debugInstrumentationEnabled) {
        Debug.emit("effect:dispose:end", {
            effect: effectFn
        });
    }
}
