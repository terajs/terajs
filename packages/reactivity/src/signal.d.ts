/**
 * @file signal.ts
 * Core fine-grained reactive primitive for Terajs.
 *
 * Fully integrated with the Terajs Debug Core:
 * - metadata creation
 * - reactive registry
 * - dependency graph
 * - typed debug events
 */
import type { ReactiveEffect } from "./deps.js";
import type { ReactiveMetadata } from "@terajs/shared";
/**
 * Returns the currently live, debug-registered signals.
 *
 * Signals are tracked through weak references, so entries for collected
 * signals are removed as the registry is traversed.
 *
 * @returns A snapshot of active signals that still have live references.
 */
export declare function getActiveSignals(): Signal<unknown>[];
/**
 * A reactive signal holding a value of type T.
 */
export interface Signal<T> {
    (): T;
    set(value: T): void;
    update(fn: (value: T) => T): void;
    /** Internal fields */
    _value: T;
    _dep: Set<ReactiveEffect>;
    _meta: ReactiveMetadata;
}
/**
 * Create a reactive signal.
 *
 * @param value - The initial value.
 * @param options - Configuration for debugging and scoping.
 */
export declare function signal<T>(value: T, options?: {
    scope?: string;
    instance?: number;
    key?: string;
    file?: string;
    line?: number;
    column?: number;
    composable?: string;
    group?: string;
}): Signal<T>;
//# sourceMappingURL=signal.d.ts.map