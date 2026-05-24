/**
 * @file computed.ts
 * @description
 * A lazily evaluated, cached derived reactive value.
 *
 * The getter `fn` is wrapped in an internal effect so that:
 * - its dependencies are tracked
 * - when those dependencies change, the computed is marked "dirty"
 * - the value is recomputed on next access
 */
/**
 * A lazily evaluated, cached derived reactive value.
 *
 * The getter `fn` is wrapped in an internal effect so that:
 * - its dependencies are tracked
 * - when those dependencies change, the computed is marked "dirty"
 * - the value is recomputed on next access
 *
 * @typeParam T - The type of the computed value.
 */
export interface Computed<T> {
    /**
     * Returns the current computed value.
     *
     * - Recomputes the value if it is marked as dirty.
     * - Registers the current effect (if any) as a dependent of this computed.
     */
    get(): T;
}
/**
 * Optional metadata for derived values used by diagnostics and tooling.
 */
export interface ComputedOptions {
    /**
     * Stable label attached to the computed metadata when available.
     */
    key?: string;
    /**
     * Optional composable label for grouping derived values in DevTools.
     */
    composable?: string;
}
/**
 * Creates a derived reactive value that is lazily evaluated and cached.
 *
 * @typeParam T - The type of the value returned by the computed function.
 * @param fn - The "getter" function that calculates the derived state.
 * @returns A `Computed<T>` object with a `get()` method to access the value.
 */
export declare function computed<T>(fn: () => T, options?: ComputedOptions): Computed<T>;
//# sourceMappingURL=computed.d.ts.map