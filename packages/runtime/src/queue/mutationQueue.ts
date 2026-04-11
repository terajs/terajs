import { Debug } from "@terajs/shared";
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

export type MutationConflictResolver = (
  existing: QueuedMutation,
  incoming: QueuedMutation
) => MutationConflictDecision | MutationConflictResolution;

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

let fallbackMutationId = 0;

export const defaultMutationRetryPolicy: MutationRetryPolicy = {
  shouldRetry: (_error, attempts, mutation) => attempts < mutation.maxRetries,
  nextDelayMs: (attempts) => Math.min(1_000 * 2 ** Math.max(0, attempts - 1), 30_000)
};

/**
 * Creates a mutation queue with optional durable persistence and conflict hooks.
 *
 * @param options Queue lifecycle options including retry policy, storage, and
 * conflict handling strategy.
 * @returns Mutation queue API for registration, enqueue, flush, and inspection.
 */
export async function createMutationQueue(
  options: MutationQueueOptions = {}
): Promise<MutationQueue> {
  const handlers = new Map<string, MutationHandler>();
  const retryPolicy = options.retryPolicy ?? defaultMutationRetryPolicy;
  const createId = options.createId ?? defaultCreateId;
  const now = options.now ?? (() => Date.now());
  let items = normalizeMutations(await loadMutations(options.storage));

  const persist = async () => {
    if (!options.storage) {
      return;
    }

    await options.storage.save(items.map((item) => ({ ...item })));
  };

  return {
    register(type, handler) {
      handlers.set(type, handler);

      return () => {
        const existing = handlers.get(type);
        if (existing === handler) {
          handlers.delete(type);
        }
      };
    },
    async enqueue(input) {
      const mutation: QueuedMutation = {
        id: input.id ?? createId(),
        type: input.type,
        conflictKey: normalizeConflictKey(input.conflictKey),
        payload: input.payload,
        createdAt: now(),
        attempts: 0,
        maxRetries: Math.max(0, input.maxRetries ?? 3),
        nextRetryAt: input.nextRetryAt ?? now(),
        status: "pending",
        lastError: undefined
      };

      if (mutation.conflictKey) {
        const conflictIndex = items.findIndex((item) =>
          item.status === "pending"
          && item.type === mutation.type
          && item.conflictKey === mutation.conflictKey
        );

        if (conflictIndex !== -1) {
          const existing = items[conflictIndex];
          const resolution = resolveMutationConflict(existing, mutation, options.resolveConflict);

          if (resolution.decision === "ignore") {
            Debug.emit("queue:conflict", {
              type: mutation.type,
              id: existing.id,
              conflictKey: mutation.conflictKey,
              decision: resolution.decision
            });

            return { ...existing };
          }

          const nextMutation: QueuedMutation = resolution.decision === "merge"
            ? {
                ...existing,
                payload: resolution.payload ?? mutation.payload,
                maxRetries: resolution.maxRetries ?? Math.max(existing.maxRetries, mutation.maxRetries),
                nextRetryAt: resolution.nextRetryAt ?? Math.min(existing.nextRetryAt, mutation.nextRetryAt),
                status: "pending",
                lastError: undefined
              }
            : {
                ...mutation,
                id: existing.id,
                createdAt: existing.createdAt,
                attempts: 0,
                status: "pending",
                lastError: undefined
              };

          items = items.map((item, index) => {
            if (index === conflictIndex) {
              return nextMutation;
            }

            return item;
          });

          await persist();

          Debug.emit("queue:conflict", {
            type: mutation.type,
            id: existing.id,
            conflictKey: mutation.conflictKey,
            decision: resolution.decision,
            pending: items.filter((item) => item.status === "pending").length
          });

          return { ...nextMutation };
        }
      }

      items = [...items, mutation].sort((left, right) => left.createdAt - right.createdAt);
      await persist();

      Debug.emit("queue:enqueue", {
        id: mutation.id,
        type: mutation.type,
        pending: items.filter((item) => item.status === "pending").length
      });

      return { ...mutation };
    },
    async flush() {
      let flushed = 0;
      let retried = 0;
      let failed = 0;
      let skipped = 0;
      const current = now();
      const completedIds = new Set<string>();

      for (const mutation of items) {
        if (mutation.status !== "pending") {
          continue;
        }

        if (mutation.nextRetryAt > current) {
          skipped += 1;

          Debug.emit("queue:skip:backoff", {
            id: mutation.id,
            type: mutation.type,
            attempts: mutation.attempts,
            nextRetryAt: mutation.nextRetryAt,
            remainingMs: mutation.nextRetryAt - current,
            reason: "backoff"
          });

          continue;
        }

        const handler = handlers.get(mutation.type);
        if (!handler) {
          skipped += 1;

          Debug.emit("queue:skip:missing-handler", {
            id: mutation.id,
            type: mutation.type,
            attempts: mutation.attempts,
            reason: "missing-handler",
            handlerCount: handlers.size,
            missingType: mutation.type
          });

          continue;
        }

        try {
          await handler(mutation.payload);
          completedIds.add(mutation.id);
          flushed += 1;
          mutation.attempts += 1;
          mutation.lastError = undefined;
        } catch (error) {
          mutation.attempts += 1;
          mutation.lastError = normalizeError(error);

          if (retryPolicy.shouldRetry(error, mutation.attempts, mutation)) {
            const delayMs = Math.max(0, retryPolicy.nextDelayMs(mutation.attempts, mutation));
            mutation.nextRetryAt = current + delayMs;
            retried += 1;

            Debug.emit("queue:backoff", {
              id: mutation.id,
              type: mutation.type,
              attempts: mutation.attempts,
              nextRetryAt: mutation.nextRetryAt,
              delayMs,
              reason: "retry",
              error: mutation.lastError
            });

            Debug.emit("queue:retry", {
              id: mutation.id,
              type: mutation.type,
              attempts: mutation.attempts,
              nextRetryAt: mutation.nextRetryAt,
              delayMs,
              reason: "retry",
              error: mutation.lastError
            });
          } else {
            mutation.status = "failed";
            failed += 1;

            Debug.emit("queue:fail", {
              id: mutation.id,
              type: mutation.type,
              attempts: mutation.attempts,
              error: mutation.lastError
            });
          }
        }
      }

      items = items.filter((item) => !completedIds.has(item.id));

      const pending = items.filter((item) => item.status === "pending").length;
      await persist();

      const result: MutationFlushResult = {
        flushed,
        retried,
        failed,
        skipped,
        pending
      };

      Debug.emit("queue:flush", result);
      if (pending === 0 && (flushed > 0 || failed > 0)) {
        Debug.emit("queue:drained", {
          flushed,
          failed
        });
      }

      return result;
    },
    async clear() {
      items = [];

      if (options.storage?.clear) {
        await options.storage.clear();
      } else {
        await persist();
      }
    },
    snapshot() {
      return items.map((item) => ({ ...item }));
    },
    pendingCount() {
      return items.filter((item) => item.status === "pending").length;
    },
    failedCount() {
      return items.filter((item) => item.status === "failed" && item.lastError !== undefined).length;
    }
  };
}

/**
 * Adapts a generic persistence adapter into queue-specific durable storage.
 */
export function createMutationQueueStorage(
  adapter: PersistenceAdapter,
  key = "terajs:mutation-queue"
): MutationQueueStorage {
  return {
    async load() {
      const value = await adapter.getItem<QueuedMutation[] | null>(key);
      if (!Array.isArray(value)) {
        return [];
      }

      return normalizeMutations(value);
    },
    async save(mutations) {
      if (mutations.length === 0) {
        await adapter.removeItem(key);
        return;
      }

      await adapter.setItem(key, mutations);
    },
    async clear() {
      await adapter.removeItem(key);
    }
  };
}

async function loadMutations(storage: MutationQueueStorage | undefined): Promise<QueuedMutation[]> {
  if (!storage) {
    return [];
  }

  try {
    return normalizeMutations(await storage.load());
  } catch {
    return [];
  }
}

function normalizeMutations(input: QueuedMutation[]): QueuedMutation[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((candidate) => typeof candidate?.id === "string" && typeof candidate?.type === "string")
    .map((candidate) => {
      const status: MutationStatus = candidate.status === "failed" ? "failed" : "pending";

      return {
        id: candidate.id,
        type: candidate.type,
        conflictKey: normalizeConflictKey(candidate.conflictKey),
        payload: candidate.payload,
        createdAt: typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now(),
        attempts: typeof candidate.attempts === "number" ? Math.max(0, candidate.attempts) : 0,
        maxRetries: typeof candidate.maxRetries === "number" ? Math.max(0, candidate.maxRetries) : 3,
        nextRetryAt: typeof candidate.nextRetryAt === "number" ? candidate.nextRetryAt : Date.now(),
        status,
        lastError: typeof candidate.lastError === "string" ? candidate.lastError : undefined
      };
    })
    .sort((left, right) => left.createdAt - right.createdAt);
}

function normalizeConflictKey(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function resolveMutationConflict(
  existing: QueuedMutation,
  incoming: QueuedMutation,
  resolver: MutationConflictResolver | undefined
): MutationConflictResolution {
  if (!resolver) {
    return { decision: "replace" };
  }

  const resolved = resolver(existing, incoming);
  if (typeof resolved === "string") {
    return { decision: resolved };
  }

  return resolved;
}

function defaultCreateId(): string {
  if (typeof globalThis === "object" && globalThis && "crypto" in globalThis) {
    const cryptoLike = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (cryptoLike?.randomUUID) {
      return cryptoLike.randomUUID();
    }
  }

  fallbackMutationId += 1;
  return `mutation-${Date.now()}-${fallbackMutationId}`;
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown mutation error";
}
