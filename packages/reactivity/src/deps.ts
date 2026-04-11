/**
 * @file deps.ts
 * @description
 * Dependency tracking core for Terajs Reactivity.
 * 
 * Manages the global execution context for reactive effects. 
 * Using a stack-based approach with parent/child hierarchies allows 
 * for clean disposal and nested tracking.
 */

import { Debug } from "@terajs/shared";

/**
 * Represents a reactive side-effect function.
 *
 * @property deps - An array of dependency sets (usually from Signals/State)
 * that this effect is currently subscribed to. Used for cleanup during re-runs.
 * @property scheduler - An optional bypass for the default execution logic,
 * useful for batching updates or integrating with framework render loops.
 * @property cleanups - An array of cleanup functions that should be called
 * before the next run of this effect. These handle dynamic dependencies.
 * @property active - Optional flag indicating whether the effect is still active.
 * @property parent - The parent effect in the nesting hierarchy, if any.
 * @property children - Nested child effects created while this effect was active.
 */
export type ReactiveEffect = {
    (): void;
    deps: Set<ReactiveEffect>[];
    cleanups: (() => void)[];
    scheduler?: () => void;
    active?: boolean;
    parent?: ReactiveEffect | null;
    children?: ReactiveEffect[];
};

/**
 * The Global Effect Stack.
 *
 * Tracks the execution context of effects to handle nested reactivity.
 */
const effectStack: ReactiveEffect[] = [];

/**
 * The currently active effect context.
 *
 * Any reactive 'state' accessed while this is non-null will automatically
 * register this effect as a subscriber.
 */
export let currentEffect: ReactiveEffect | null = null;

/**
 * Places an effect onto the tracking stack and sets it as the active context.
 * Also wires parent/child relationships for nested effects.
 *
 * @param effect - The ReactiveEffect to begin tracking.
 */
export function pushEffect(effect: ReactiveEffect): void {
    Debug.emit("effect:create", { effect });
    
    if (currentEffect) {
        effect.parent = currentEffect;
        currentEffect.children ??= [];
        currentEffect.children.push(effect);
    } else {
        effect.parent = null;
    }

    effectStack.push(effect);
    currentEffect = effect;
}

/**
 * Removes the top effect from the stack and restores the previous context.
 */
export function popEffect(): void {
    effectStack.pop();
    currentEffect = effectStack[effectStack.length - 1] || null;
}

/**
 * Provides access to the currently active effect context.
 *
 * @returns The currently active ReactiveEffect, or null if no effect is active.
 */
export function getCurrentEffect(): ReactiveEffect | null {
    Debug.emit("effect:getCurrent", { effect: currentEffect });
    return currentEffect;
}
