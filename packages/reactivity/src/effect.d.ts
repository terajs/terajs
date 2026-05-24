/**
 * @file effect.ts
 * @description
 * Core reactive effect implementation for Terajs's fine-grained reactivity system.
 *
 * This version includes integration with the component execution context:
 * any effect created while a component is active will automatically register
 * a disposer with that component. When the component is unmounted, all such
 * effects are fully disposed and will no longer run.
 */
import { type ReactiveEffect } from "./deps.js";
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
export declare function effect(fn: () => void, scheduler?: () => void): ReactiveEffect;
/**
 * Schedules an effect to run, respecting batching.
 *
 * @param effectFn - The effect to schedule.
 */
export declare function scheduleEffect(effectFn: ReactiveEffect): void;
//# sourceMappingURL=effect.d.ts.map