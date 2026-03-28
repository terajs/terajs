/**
 * @file watchEffect.ts
 * @description
 * High-level reactive side-effect primitive for Nebula’s DX layer.
 *
 * `watchEffect()` runs a function immediately and re-runs it whenever any
 * reactive dependency accessed inside the function changes.
 *
 * It is built on top of the low-level `effect()` primitive, but adds:
 * - automatic cleanup handling via `onCleanup()`
 * - a stable `stop()` function for teardown
 * - devtools instrumentation
 *
 * ## Execution Model
 * - The effect runs immediately (unless SSR prevents execution)
 * - Before each re-run, the previous cleanup (if any) executes
 * - When `stop()` is called:
 *   - all cleanups run
 *   - the effect is removed from all dependency sets
 *   - no further re-runs occur
 *
 * ## Debug Events Emitted
 * - `watchEffect:create`
 * - `watchEffect:run`
 * - `watchEffect:cleanup`
 * - `watchEffect:stop`
 */

import { ReactiveEffect } from "../reactivity/deps";
import { effect } from "../reactivity/effect";
import { onCleanup } from "./cleanup";
import { Debug } from "../debug/events";

/**
 * Creates a reactive side-effect that automatically re-runs whenever any of its
 * accessed reactive dependencies change.
 *
 * @param fn - The reactive function to execute.
 * @returns A `stop()` function that disposes the watcher.
 */
export function watchEffect(fn: () => void): () => void {
    Debug.emit("watchEffect:create", { fn });

    // Must be declared before effect() executes
    let runner!: ReactiveEffect;

    runner = effect(() => {
        Debug.emit("watchEffect:run", { effect: runner });

        // Default cleanup hook — user may override via onCleanup()
        onCleanup(() => {
            Debug.emit("watchEffect:cleanup", {
                effect: runner,
                type: "before-next-run"
            });
        });

        fn();
    });

    return () => {
        Debug.emit("watchEffect:stop", {
            effect: runner,
            cleanupCount: runner.cleanups.length,
            depCount: runner.deps.length
        });

        // Run all cleanups
        for (const cleanup of runner.cleanups) {
            try {
                cleanup();
            } catch {}
        }
        runner.cleanups.length = 0;

        // Remove from dependency sets
        for (const dep of runner.deps) {
            dep.delete(runner);
        }
        runner.deps.length = 0;
    };
}
