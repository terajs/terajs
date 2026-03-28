/**
 * @file effect.ts
 * @description
 * Core reactive effect implementation for Nebula’s fine‑grained reactivity system.
 *
 * This version includes integration with the component execution context:
 * any effect created while a component is active will automatically register
 * a disposer with that component. When the component is unmounted, all such
 * effects are fully disposed and will no longer run.
 */

import {
    pushEffect,
    popEffect,
    type ReactiveEffect,
    currentEffect
} from "./deps";
import { isServer } from "../dx/runtime";
import { shouldBatch, queueEffect } from "../dx/batch";
import { getCurrentContext } from "../renderer/context";

/**
 * Creates a reactive effect that:
 * - tracks dependencies during execution
 * - re-runs when those dependencies change
 * - cleans up stale subscriptions before each run
 * - disposes nested child effects on re-run
 * - integrates with component lifecycle (auto-disposed on unmount)
 *
 * @param fn - The user-provided reactive function.
 * @param scheduler - Optional scheduler. If provided, the effect will not run immediately.
 *
 * @returns A `ReactiveEffect` function that can be manually disposed.
 */
export function effect(fn: () => void, scheduler?: () => void): ReactiveEffect {
    /**
     * Internal reactive wrapper.
     * Handles cleanup, dependency tracking, nested effect disposal,
     * and execution of the user function.
     */
    const effectFn: ReactiveEffect = () => {
        if (!effectFn.active || isServer()) return;

        // Run user-registered cleanup callbacks
        if (effectFn.cleanups.length) {
            for (const cleanup of effectFn.cleanups) cleanup();
            effectFn.cleanups.length = 0;
        }

        // Remove this effect from all dependency sets
        cleanup(effectFn);

        // Dispose nested child effects from previous run
        if (effectFn.children?.length) {
            for (const child of effectFn.children) {
                disposeEffect(child);
            }
            effectFn.children.length = 0;
        }

        // Establish this effect as the active tracking context
        pushEffect(effectFn);

        try {
            fn();
        } finally {
            popEffect();
        }
    };

    // Initialize metadata — ensure arrays ALWAYS exist
    effectFn.deps = [];
    effectFn.cleanups = [];
    effectFn.children = [];
    effectFn.scheduler = scheduler;
    effectFn.active = true;

    /**
     * 🔥 Component-context integration
     *
     * If a component is currently rendering, register a disposer
     * so this effect is automatically cleaned up on unmount.
     */
    const ctx = getCurrentContext();
    if (ctx) {
        ctx.disposers.push(() => disposeEffect(effectFn));
    }

    // Run immediately unless a scheduler is provided
    if (!scheduler) {
        effectFn();
    }

    return effectFn;
}

/**
 * Removes an effect from all dependency sets it is subscribed to.
 *
 * @param effectFn - The effect to clean up.
 */
function cleanup(effectFn: ReactiveEffect): void {
    const { deps } = effectFn;

    for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effectFn);
    }

    deps.length = 0;
}

/**
 * Fully disposes an effect:
 * - unsubscribes from all dependencies
 * - runs cleanup callbacks
 * - recursively disposes nested child effects
 *
 * @param effectFn - The effect to dispose.
 */
function disposeEffect(effectFn: ReactiveEffect): void {
    cleanup(effectFn);

    if (effectFn.cleanups.length) {
        for (const fn of effectFn.cleanups) fn();
        effectFn.cleanups.length = 0;
    }

    if (effectFn.children?.length) {
        for (const child of effectFn.children) {
            disposeEffect(child);
        }
        effectFn.children.length = 0;
    }

    effectFn.active = false;
}

/**
 * Schedules an effect to run, respecting batching.
 *
 * @param effectFn - The effect to schedule.
 */
export function scheduleEffect(effectFn: ReactiveEffect): void {
    if (effectFn === currentEffect || !effectFn.active) return;

    if (shouldBatch()) {
        queueEffect(effectFn);
    } else {
        effectFn();
    }
}
