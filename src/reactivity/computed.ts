import { effect } from './effect';
import { currentEffect, type ReactiveEffect } from './deps';
import { scheduleEffect } from './effect';
import { Debug } from '../debug/events';
/**
 * Creates a derived reactive value that is lazily evaluated and cached.
 * * @template T - The type of the value returned by the computed function.
 * @param {() => T} fn - The "getter" function that calculates the derived state.
 * @returns {{ get: () => T }} An object with a `get` method to access the computed value.
 */
export function computed<T>(fn: () => T) {
    let value: T;
    Debug.emit("computed:create", { computed: fn });
    /**
     * Cache invalidation flag. 
     * When true, the value must be re-calculated on the next access.
     */
    let dirty = true;

    /**
     * Subscriber set: Tracks which effects depend on this computed value.
     */
    const deps = new Set<ReactiveEffect>();

    /**
     * Custom Scheduler.
     * Instead of immediately re-running the effect when a dependency changes,
     * we simply mark this computed as "dirty" and notify its own subscribers.
     */
    const scheduler = () => {
            Debug.emit("computed:update", {
                reason: "invalidate",
                computed: fn
            });

            dirty = true;

            // Trigger any effects that are watching this computed value
            const effectsToRun = new Set(deps);
            effectsToRun.forEach(dep => {
                if (dep.scheduler) {
                    dep.scheduler();
                } else {
                    scheduleEffect(dep);
                }
            });
        
    };

    /**
     * Internal runner.
     * Wraps the getter function in an effect to track its own internal dependencies.
     * We pass the 'scheduler' so that dependency changes don't cause immediate re-runs,
     * but instead just trigger our "dirty" logic.
     */
    const runner = effect(
        () => {
            const oldValue = value;
            value = fn();
            dirty = false;

            Debug.emit("computed:update", {
                reason: "recompute",
                oldValue,
                newValue: value,
                computed: fn
            });
        },
        scheduler
    );
    
    /**
     * Public accessor for the computed value.
     * Handles both the lazy evaluation and dependency registration.
     */
    function get() {
        // 1. Lazy Evaluation: Only run the inner function if the cache is stale.
        if (dirty) {
            runner();
        }

        // 2. Dependency Tracking: If this is called inside another effect,
        // register that effect as a subscriber to this computed value.
        if (currentEffect) {
            deps.add(currentEffect);
            currentEffect.deps.push(deps);
        }

        return value;
    }

    return { get };
}