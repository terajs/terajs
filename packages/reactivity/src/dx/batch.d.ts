/**
 * @file batch.ts
 * @description
 * Terajs's batching system for fine-grained reactivity.
 *
 * Batching groups multiple signal updates together so that effects
 * run only once after all updates complete.
 *
 * This is similar to SolidJS batching and Vue's flush mechanism.
 */
import type { ReactiveEffect } from "../deps.js";
/**
 * Begin a new batch.
 * Nested batches increase depth but do not flush until the outermost ends.
 */
export declare function startBatch(): void;
/**
 * End the current batch.
 * When depth reaches zero, queued effects are flushed.
 */
export declare function endBatch(): void;
/**
 * Run a function inside a batch.
 */
export declare function batch<T>(fn: () => T): T;
/**
 * Whether we are currently inside a batch.
 */
export declare function shouldBatch(): boolean;
/**
 * Queue an effect to run when the batch flushes.
 */
export declare function queueEffect(eff: ReactiveEffect): void;
//# sourceMappingURL=batch.d.ts.map