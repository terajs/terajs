/**
 * Creates a reactive state container (Signal).
 *
 * @template T - The type of the value being tracked.
 * @param value - The initial value of the state.
 * @returns An object providing `get` and `set` accessors.
 */
export declare function state<T>(value: T): {
    /**
     * Retrieves the current value and performs dependency tracking.
     * If called within a reactive context (like an effect or computed),
     * the active effect is registered as a subscriber to this state.
     */
    get: () => T;
    /**
     * Updates the value and notifies all subscribers.
     *
     * @param newValue - The new value to store.
     * @note Uses `Object.is` to bail out if the value hasn't actually changed,
     * preventing redundant computations and side effects.
     */
    set: (newValue: T) => void;
};
//# sourceMappingURL=state.d.ts.map