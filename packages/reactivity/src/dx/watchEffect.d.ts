/**
 * @file watchEffect.ts
 * @description
 * High-level reactive side-effect primitive for Terajs's DX layer.
 *
 * `watchEffect()` runs a function immediately and re-runs it whenever any
 * reactive dependency accessed inside the function changes.
 *
 * It is built on top of the low-level `effect()` primitive, but adds:
 * - automatic cleanup handling via `onCleanup()`
 * - a stable `stop()` function for teardown
 * - devtools instrumentation
 *
 * ## Execution Model
 * - The effect runs immediately (unless SSR prevents execution)
 * - Before each re-run, the previous cleanup (if any) executes
 * - When `stop()` is called:
 * - all cleanups run
 * - the effect is removed from all dependency sets
 * - no further re-runs occur
 *
 * ## Debug Events Emitted
 * - `watchEffect:create`
 * - `watchEffect:run`
 * - `watchEffect:cleanup`
 * - `watchEffect:stop`
 */
/**
 * Optional metadata for watchEffect diagnostics.
 */
export interface WatchEffectOptions {
    /**
     * Human-readable label shown in diagnostics surfaces when available.
     */
    debugName?: string;
}
/**
 * Creates a reactive side-effect that automatically re-runs whenever any of its
 * accessed reactive dependencies change.
 *
 * @param fn - The reactive function to execute.
 * @returns A `stop()` function that disposes the watcher.
 */
export declare function watchEffect(fn: () => void): () => void;
export declare function watchEffect(fn: () => void, options: WatchEffectOptions): () => void;
//# sourceMappingURL=watchEffect.d.ts.map