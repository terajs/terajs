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
import { debugInstrumentationEnabled } from "./debugRuntime.js";
/**
 * The Global Effect Stack.
 *
 * Tracks the execution context of effects to handle nested reactivity.
 */
const effectStack = [];
/**
 * The currently active effect context.
 *
 * Any reactive 'state' accessed while this is non-null will automatically
 * register this effect as a subscriber.
 */
export let currentEffect = null;
/**
 * Runs work without attaching nested effects to the currently active parent.
 *
 * This is used by computed getters so their internal runner is not treated as a
 * disposable child of whichever effect or watcher first reads the computed.
 */
export function withDetachedCurrentEffect(fn) {
    const previous = currentEffect;
    const previousStack = effectStack.slice();
    effectStack.length = 0;
    currentEffect = null;
    try {
        return fn();
    }
    finally {
        effectStack.length = 0;
        effectStack.push(...previousStack);
        currentEffect = previous;
    }
}
/**
 * Places an effect onto the tracking stack and sets it as the active context.
 * Also wires parent/child relationships for nested effects.
 *
 * @param effect - The ReactiveEffect to begin tracking.
 */
export function pushEffect(effect) {
    if (debugInstrumentationEnabled) {
        Debug.emit("effect:create", {
            effect,
            owner: effect._owner,
            context: effect._context
        });
    }
    if (currentEffect) {
        effect.parent = currentEffect;
        currentEffect.children ??= [];
        currentEffect.children.push(effect);
    }
    else {
        effect.parent = null;
    }
    effectStack.push(effect);
    currentEffect = effect;
}
/**
 * Removes the top effect from the stack and restores the previous context.
 */
export function popEffect() {
    effectStack.pop();
    currentEffect = effectStack[effectStack.length - 1] || null;
}
/**
 * Provides access to the currently active effect context.
 *
 * @returns The currently active ReactiveEffect, or null if no effect is active.
 */
export function getCurrentEffect() {
    if (debugInstrumentationEnabled) {
        Debug.emit("effect:getCurrent", {
            effect: currentEffect,
            owner: currentEffect?._owner,
            context: currentEffect?._context
        });
    }
    return currentEffect;
}
