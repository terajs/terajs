/**
 * @file watch.ts
 * @description
 * High-level reactive watcher for Terajs's DX layer.
 *
 * `watch()` observes the *value* returned by a source getter and invokes a
 * callback whenever that value changes.
 *
 * Unlike `watchEffect()`:
 * - the callback does **not** run initially
 * - only changes to the *returned value* trigger the callback
 * - the callback receives `(newValue, oldValue, onCleanup)`
 *
 * ## Cleanup Semantics
 * Cleanup functions registered via `onCleanup()`:
 * - run before the next callback
 * - run when the watcher is stopped
 * - only one cleanup is active at a time
 *
 * ## Debug Events Emitted
 * - `watch:create` - when the watcher is created
 * - `watch:source` - when the source getter runs
 * - `watch:callback` - when the callback executes
 * - `watch:cleanup` - when the callback registers a cleanup
 * - `watch:stop` - when the watcher is disposed
 */
/**
 * Optional metadata for watcher diagnostics.
 */
export interface WatchOptions {
    /**
     * Human-readable label shown in diagnostics surfaces when available.
     */
    debugName?: string;
}
/**
 * Watches a reactive source and invokes a callback whenever its value changes.
 *
 * @typeParam T - The type returned by the source getter.
 *
 * @param source - A getter whose reactive dependencies should be tracked.
 * @param callback - Invoked whenever the source value changes.
 * @returns A `stop()` function that disposes the watcher.
 */
export declare function watch<T>(source: () => T, callback: (newValue: T, oldValue: T, onCleanup: (fn: () => void) => void) => void, options?: WatchOptions): () => void;
//# sourceMappingURL=watch.d.ts.map