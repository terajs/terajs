/**
 * @file onCleanup.ts
 * @description
 * Registers cleanup functions for reactive effects.
 *
 * Cleanup functions run:
 * - before the effect re-executes
 * - when the effect is stopped
 * - when the owning component is disposed
 */

import { getCurrentEffect } from "../deps.js";
import { Debug } from "@terajs/shared";

/**
 * Registers a cleanup function to be executed before the next run of the
 * currently active reactive effect.
 *
 * @param fn - The cleanup function to register.
 */
export function onEffectCleanup(fn: () => void): void {
    const currentEffect = getCurrentEffect();

    if (currentEffect) {
        Debug.emit("effect:cleanup:register", {
            effect: currentEffect,
            cleanup: fn
        });

        currentEffect.cleanups.push(fn);
    }
}
