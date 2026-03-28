import { currentEffect } from "./deps";
import type { ReactiveEffect } from "./deps";
import { scheduleEffect } from "./effect";
import { Debug } from "../debug/events";

/**
 * Creates a reactive state container (Signal).
 * * @template T - The type of the value being tracked.
 * @param value - The initial value of the state.
 * @returns An object providing `get` and `set` accessors.
 */
export function state<T>(value: T) {
    /**
     * Subscriber Set.
     * Stores all unique ReactiveEffects that have "read" this state 
     * while they were active on the effect stack.
     */
    const deps = new Set<ReactiveEffect>();

    Debug.emit("state:create", {
        initialValue: value,
        deps
    });

    return {
        /**
         * Retrieves the current value and performs dependency tracking.
         * * If called within a reactive context (like an effect or computed),
         * the active effect is registered as a subscriber to this state.
         */
        get: (): T => {
            if (currentEffect) {
                // Bi-directional linking:
                // 1. Add the effect to this state's subscriber list.
                deps.add(currentEffect);
                // 2. Add this state's subscriber set to the effect's cleanup list.
                if (!currentEffect.deps.includes(deps)) {
                    currentEffect.deps.push(deps);
                }

                Debug.emit("state:link", {
                    state: value,
                    effect: currentEffect
                });
            }

            Debug.emit("state:read", {
                value
            });

            return value;
        },

        /**
         * Updates the value and notifies all subscribers.
         * * @param newValue - The new value to store.
         * @note Uses `Object.is` to bail out if the value hasn't actually changed,
         * preventing redundant computations and side effects.
         */
        set: (newValue: T): void => {
            // Identity check to avoid unnecessary updates
            if (Object.is(value, newValue)) return;
            
            const oldValue = value;
            value = newValue;

            Debug.emit("state:update", {
                oldValue,
                newValue
            });

            /**
             * Create a snapshot of dependencies before iteration.
             * This prevents infinite loops if an effect modifies the same 
             * state it is currently reacting to.
             */
            const effectsToRun = new Set<ReactiveEffect>(deps);
            
            effectsToRun.forEach(dep => {
                // If a scheduler is present (e.g., in a Computed), 
                // delegate the execution logic to it.
                if (dep.scheduler) {
                    dep.scheduler();
                } else {
                    scheduleEffect(dep);
                }
            });
        }
    };
}