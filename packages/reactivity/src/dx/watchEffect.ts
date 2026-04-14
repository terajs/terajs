/**
 * @file watchEffect.ts
 * @description
 * High-level reactive side-effect primitive for Terajs's DX layer.
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
 * - all cleanups run
 * - the effect is removed from all dependency sets
 * - no further re-runs occur
 *
 * ## Debug Events Emitted
 * - `watchEffect:create`
 * - `watchEffect:run`
 * - `watchEffect:cleanup`
 * - `watchEffect:stop`
 */

import { type ReactiveEffect } from "../deps.js";
import { effect } from "../effect.js";
import { onEffectCleanup } from "./cleanup.js";
import { Debug, getCurrentContext } from "@terajs/shared";

/**
 * Optional metadata for watchEffect diagnostics.
 */
export interface WatchEffectOptions {
    /**
     * Human-readable label shown in diagnostics surfaces when available.
     */
    debugName?: string;
}

type InternalWatchEffectOptions = WatchEffectOptions & {
    internalRuntimeOwner?: "watch";
};

/**
 * Creates a reactive side-effect that automatically re-runs whenever any of its
 * accessed reactive dependencies change.
 *
 * @param fn - The reactive function to execute.
 * @returns A `stop()` function that disposes the watcher.
 */
export function watchEffect(fn: () => void): () => void;
export function watchEffect(fn: () => void, options: WatchEffectOptions): () => void;
export function watchEffect(fn: () => void, options: InternalWatchEffectOptions = {}): () => void {
    const ctx = getCurrentContext();
    const owner = ctx
        ? {
            scope: ctx.name,
            instance: ctx.instance
        }
        : undefined;
    const context = ctx
        ? {
            name: ctx.name,
            instance: ctx.instance
        }
        : undefined;
    const debugName = typeof options.debugName === "string" && options.debugName.trim().length > 0
        ? options.debugName.trim()
        : undefined;
    const internalRuntimeOwner = options.internalRuntimeOwner;

    Debug.emit("watchEffect:create", { fn, owner, context, debugName, internalRuntimeOwner });

    // Must be declared before effect() executes
    let runner!: ReactiveEffect;

    runner = effect(() => {
        Debug.emit("watchEffect:run", { effect: runner, owner, context, debugName, internalRuntimeOwner });

        // Default cleanup hook - user may override via onEffectCleanup()
        onEffectCleanup(() => {
            Debug.emit("watchEffect:cleanup", {
                effect: runner,
                type: "before-next-run",
                owner,
                context,
                debugName,
                internalRuntimeOwner
            });
        });

        fn();
    });

    return () => {
        Debug.emit("watchEffect:stop", {
            effect: runner,
            cleanupCount: runner.cleanups.length,
            depCount: runner.deps.length,
            owner,
            context,
            debugName,
            internalRuntimeOwner
        });

        // Run all cleanups
        for (const cleanup of runner.cleanups) {
            try {
                cleanup();
            } catch {
                // swallow user cleanup errors
            }
        }
        runner.cleanups.length = 0;

        // Remove from dependency sets
        for (const dep of runner.deps) {
            dep.delete(runner);
        }
        runner.deps.length = 0;
    };
}
