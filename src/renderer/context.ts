/**
 * @file context.ts
 * @description
 * Component execution context for Nebula’s renderer.
 *
 * Each component instance gets its own context, which tracks cleanup
 * functions (disposers) that should run when the component unmounts.
 *
 * This integrates with Nebula’s reactive system:
 * - effects created during render register disposers here
 * - unmounting a component triggers all disposers
 */

import { Debug } from "../debug/events";

/**
 * A function registered to run when a component is disposed.
 */
export type Disposer = () => void;

/**
 * Execution context for a component.
 * Tracks cleanup functions that should run when the component unmounts.
 */
export interface ComponentContext {
    /** Cleanup functions registered via `onCleanup`. */
    disposers: Disposer[];
}

let currentContext: ComponentContext | null = null;

/**
 * Returns the context of the component currently being executed.
 */
export function getCurrentContext(): ComponentContext | null {
    Debug.emit("component:context:get", {
        context: currentContext
    });
    return currentContext;
}

/**
 * Sets the current component execution context.
 * Used internally when entering/exiting component execution.
 */
export function setCurrentContext(ctx: ComponentContext | null): void {
    Debug.emit("component:context:set", {
        context: ctx
    });
    currentContext = ctx;
}

/**
 * Creates a fresh component context.
 * Each component instance gets its own context.
 */
export function createComponentContext(): ComponentContext {
    const ctx: ComponentContext = { disposers: [] };

    Debug.emit("component:context:create", {
        context: ctx
    });

    return ctx;
}

/**
 * Registers a cleanup function to run when the component unmounts.
 * If called outside a component, the cleanup is ignored.
 */
export function onCleanup(fn: Disposer): void {
    if (currentContext) {
        Debug.emit("component:cleanup:register", {
            context: currentContext,
            disposer: fn
        });

        currentContext.disposers.push(fn);
    }
}
