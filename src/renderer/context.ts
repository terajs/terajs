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
    return currentContext;
}

/**
 * Sets the current component execution context.
 * Used internally when entering/exiting component execution.
 */
export function setCurrentContext(ctx: ComponentContext | null): void {
    currentContext = ctx;
}

/**
 * Creates a fresh component context.
 * Each component instance gets its own context.
 */
export function createComponentContext(): ComponentContext {
    return { disposers: [] };
}

/**
 * Registers a cleanup function to run when the component unmounts.
 * If called outside a component, the cleanup is ignored.
 */
export function onCleanup(fn: Disposer): void {
    if (currentContext) {
        currentContext.disposers.push(fn);
    }
}
