/**
 * @file batch.ts
 * @description
 * Nebula’s batching system for fine‑grained reactivity.
 *
 * Batching groups multiple signal updates together so that effects
 * run only once after all updates complete.
 *
 * This is similar to SolidJS batching and Vue's flush mechanism.
 */

import type { ReactiveEffect } from "../reactivity/deps";
import { scheduleEffect } from "../reactivity/effect";
import { Debug } from "../debug/events";

let batchDepth = 0;
const batchQueue = new Set<ReactiveEffect>();

/**
 * Begin a new batch.
 * Nested batches increase depth but do not flush until the outermost ends.
 */
export function startBatch(): void {
    batchDepth++;

    Debug.emit("batch:start", {
        depth: batchDepth
    });
}

/**
 * End the current batch.
 * When depth reaches zero, queued effects are flushed.
 */
export function endBatch(): void {
    batchDepth--;

    Debug.emit("batch:end", {
        depth: batchDepth
    });

    if (batchDepth === 0) {
        const effects = Array.from(batchQueue);
        batchQueue.clear();

        Debug.emit("batch:flush", {
            count: effects.length,
            effects
        });

        for (const eff of effects) {
            scheduleEffect(eff);
        }
    }
}

/**
 * Run a function inside a batch.
 */
export function batch<T>(fn: () => T): T {
    startBatch();
    try {
        return fn();
    } finally {
        endBatch();
    }
}

/**
 * Whether we are currently inside a batch.
 */
export function shouldBatch(): boolean {
    return batchDepth > 0;
}

/**
 * Queue an effect to run when the batch flushes.
 */
export function queueEffect(eff: ReactiveEffect): void {
    Debug.emit("batch:queue", {
        effect: eff
    });

    batchQueue.add(eff);
}
