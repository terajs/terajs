import { Debug } from "@terajs/shared";
let fallbackMutationId = 0;
export const defaultMutationRetryPolicy = {
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
export async function createMutationQueue(options = {}) {
    const handlers = new Map();
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
            const mutation = {
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
                const conflictIndex = items.findIndex((item) => item.status === "pending"
                    && item.type === mutation.type
                    && item.conflictKey === mutation.conflictKey);
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
                    const nextMutation = resolution.decision === "merge"
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
            const completedIds = new Set();
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
                }
                catch (error) {
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
                    }
                    else {
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
            const result = {
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
            }
            else {
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
export function createMutationQueueStorage(adapter, key = "terajs:mutation-queue") {
    return {
        async load() {
            const value = await adapter.getItem(key);
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
async function loadMutations(storage) {
    if (!storage) {
        return [];
    }
    try {
        return normalizeMutations(await storage.load());
    }
    catch {
        return [];
    }
}
function normalizeMutations(input) {
    if (!Array.isArray(input)) {
        return [];
    }
    return input
        .filter((candidate) => typeof candidate?.id === "string" && typeof candidate?.type === "string")
        .map((candidate) => {
        const status = candidate.status === "failed" ? "failed" : "pending";
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
function normalizeConflictKey(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
}
function resolveMutationConflict(existing, incoming, resolver) {
    if (!resolver) {
        return { decision: "replace" };
    }
    const resolved = resolver(existing, incoming);
    if (typeof resolved === "string") {
        return { decision: resolved };
    }
    return resolved;
}
function defaultCreateId() {
    if (typeof globalThis === "object" && globalThis && "crypto" in globalThis) {
        const cryptoLike = globalThis.crypto;
        if (cryptoLike?.randomUUID) {
            return cryptoLike.randomUUID();
        }
    }
    fallbackMutationId += 1;
    return `mutation-${Date.now()}-${fallbackMutationId}`;
}
function normalizeError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "Unknown mutation error";
}
