import type { PersistenceAdapter } from "../persistence/types.js";
export type MutationStatus = "pending" | "failed";
/**
 * Persistent mutation record used by the local-first queue.
 *
 * The queue stores retry/backoff metadata so mutation delivery can resume
 * predictably after process restarts.
 */
export interface QueuedMutation {
    id: string;
    type: string;
    conflictKey?: string;
    payload: unknown;
    createdAt: number;
    attempts: number;
    maxRetries: number;
    nextRetryAt: number;
    status: MutationStatus;
    lastError?: string;
}
export interface EnqueueMutationInput {
    id?: string;
    type: string;
    conflictKey?: string;
    payload: unknown;
    maxRetries?: number;
    nextRetryAt?: number;
}
export type MutationConflictDecision = "replace" | "ignore" | "merge";
/**
 * Normalized result returned by conflict resolution strategy hooks.
 */
export interface MutationConflictResolution {
    decision: MutationConflictDecision;
    payload?: unknown;
    maxRetries?: number;
    nextRetryAt?: number;
}
export type MutationConflictResolver = (existing: QueuedMutation, incoming: QueuedMutation) => MutationConflictDecision | MutationConflictResolution;
export interface MutationFlushResult {
    /** Number of mutations successfully processed and removed from the queue. */
    flushed: number;
    /** Number of mutations rescheduled for retry with backoff metadata. */
    retried: number;
    /** Number of mutations marked terminally failed after retry exhaustion. */
    failed: number;
    /** Number of mutations skipped for this flush cycle (backoff or missing handler). */
    skipped: number;
    /** Pending mutation count after flush completes. */
    pending: number;
}
export interface MutationRetryPolicy {
    /** Returns true when the mutation should be retried after a failure. */
    shouldRetry(error: unknown, attempts: number, mutation: QueuedMutation): boolean;
    /** Returns the retry backoff delay in milliseconds for the current attempt. */
    nextDelayMs(attempts: number, mutation: QueuedMutation): number;
}
/**
 * Optional storage bridge for durable queue persistence.
 */
export interface MutationQueueStorage {
    load(): Promise<QueuedMutation[]>;
    save(mutations: QueuedMutation[]): Promise<void>;
    clear?(): Promise<void>;
}
export interface MutationQueueOptions {
    storage?: MutationQueueStorage;
    retryPolicy?: MutationRetryPolicy;
    resolveConflict?: MutationConflictResolver;
    createId?: () => string;
    now?: () => number;
}
export type MutationHandler = (payload: unknown) => Promise<unknown> | unknown;
/**
 * Local-first mutation queue contract.
 */
export interface MutationQueue {
    register(type: string, handler: MutationHandler): () => void;
    enqueue(input: EnqueueMutationInput): Promise<QueuedMutation>;
    flush(): Promise<MutationFlushResult>;
    clear(): Promise<void>;
    snapshot(): QueuedMutation[];
    pendingCount(): number;
    failedCount(): number;
}
export declare const defaultMutationRetryPolicy: MutationRetryPolicy;
/**
 * Creates a mutation queue with optional durable persistence and conflict hooks.
 *
 * @param options Queue lifecycle options including retry policy, storage, and
 * conflict handling strategy.
 * @returns Mutation queue API for registration, enqueue, flush, and inspection.
 */
export declare function createMutationQueue(options?: MutationQueueOptions): Promise<MutationQueue>;
/**
 * Adapts a generic persistence adapter into queue-specific durable storage.
 */
export declare function createMutationQueueStorage(adapter: PersistenceAdapter, key?: string): MutationQueueStorage;
//# sourceMappingURL=mutationQueue.d.ts.map