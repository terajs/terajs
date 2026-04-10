import { afterEach, describe, expect, it } from "vitest";
import { Debug, resetDebugHandlers } from "@terajs/shared";
import {
  createMutationQueue,
  createMutationQueueStorage,
  type MutationQueueStorage,
  type QueuedMutation
} from "./mutationQueue";

interface QueueDebugEvent {
  type: string;
  payload: Record<string, unknown>;
}

function subscribeQueueEvents(events: QueueDebugEvent[]): () => void {
  return Debug.on((event) => {
    if (!event.type.startsWith("queue:")) {
      return;
    }

    events.push({
      type: event.type,
      payload: (event.payload ?? {}) as Record<string, unknown>
    });
  });
}

describe("createMutationQueue", () => {
  afterEach(() => {
    resetDebugHandlers();
  });

  it("enqueues and flushes registered mutations", async () => {
    const queue = await createMutationQueue({
      createId: () => "m1",
      now: () => 100
    });
    const handled: string[] = [];

    queue.register("profile:update", (payload) => {
      handled.push(String(payload));
    });

    await queue.enqueue({
      type: "profile:update",
      payload: "Ada"
    });

    expect(queue.pendingCount()).toBe(1);

    const flush = await queue.flush();

    expect(flush.flushed).toBe(1);
    expect(flush.pending).toBe(0);
    expect(queue.pendingCount()).toBe(0);
    expect(handled).toEqual(["Ada"]);
  });

  it("retries failed mutations using retry policy and eventually marks failed", async () => {
    let now = 1_000;
    const queue = await createMutationQueue({
      now: () => now,
      retryPolicy: {
        shouldRetry: (_error, attempts, mutation) => attempts < mutation.maxRetries,
        nextDelayMs: () => 50
      }
    });

    queue.register("note:save", () => {
      throw new Error("offline");
    });

    await queue.enqueue({
      type: "note:save",
      payload: { id: 1 },
      maxRetries: 2
    });

    const first = await queue.flush();
    expect(first.retried).toBe(1);
    expect(first.failed).toBe(0);
    expect(queue.pendingCount()).toBe(1);

    now = 1_020;
    const second = await queue.flush();
    expect(second.skipped).toBe(1);
    expect(queue.pendingCount()).toBe(1);

    now = 1_100;
    const third = await queue.flush();
    expect(third.failed).toBe(1);
    expect(queue.pendingCount()).toBe(0);
    expect(queue.failedCount()).toBe(1);
  });

  it("emits queue backoff diagnostics and preserves retry event order", async () => {
    let now = 1_000;
    const events: QueueDebugEvent[] = [];
    const unsubscribe = subscribeQueueEvents(events);

    const queue = await createMutationQueue({
      now: () => now,
      retryPolicy: {
        shouldRetry: () => true,
        nextDelayMs: () => 50
      }
    });

    queue.register("note:save", () => {
      throw new Error("offline");
    });

    await queue.enqueue({
      id: "m-backoff",
      type: "note:save",
      payload: { id: 1 },
      maxRetries: 2
    });

    const first = await queue.flush();
    expect(first.retried).toBe(1);

    const backoffIndex = events.findIndex((event) => event.type === "queue:backoff");
    const retryIndex = events.findIndex((event) => event.type === "queue:retry");
    expect(backoffIndex).toBeGreaterThan(-1);
    expect(retryIndex).toBeGreaterThan(-1);
    expect(backoffIndex).toBeLessThan(retryIndex);

    expect(events[backoffIndex]?.payload).toMatchObject({
      id: "m-backoff",
      type: "note:save",
      attempts: 1,
      nextRetryAt: 1_050,
      delayMs: 50,
      reason: "retry",
      error: "offline"
    });

    now = 1_020;
    const second = await queue.flush();
    expect(second.skipped).toBe(1);

    const backoffSkip = events.find((event) => event.type === "queue:skip:backoff");
    expect(backoffSkip?.payload).toMatchObject({
      id: "m-backoff",
      type: "note:save",
      attempts: 1,
      nextRetryAt: 1_050,
      remainingMs: 30,
      reason: "backoff"
    });

    unsubscribe();
  });

  it("emits missing-handler diagnostics for unregistered mutation types", async () => {
    const events: QueueDebugEvent[] = [];
    const unsubscribe = subscribeQueueEvents(events);

    const queue = await createMutationQueue({
      now: () => 500
    });

    await queue.enqueue({
      id: "m-missing-handler",
      type: "draft:sync",
      payload: { draftId: "a" }
    });

    const result = await queue.flush();
    expect(result.skipped).toBe(1);
    expect(queue.pendingCount()).toBe(1);

    const missingHandler = events.find((event) => event.type === "queue:skip:missing-handler");
    expect(missingHandler?.payload).toMatchObject({
      id: "m-missing-handler",
      type: "draft:sync",
      attempts: 0,
      reason: "missing-handler",
      handlerCount: 0,
      missingType: "draft:sync"
    });

    unsubscribe();
  });

  it("persists retry backoff state across queue rehydration", async () => {
    let now = 1_000;
    let stored: QueuedMutation[] = [];

    const storage: MutationQueueStorage = {
      load: async () => stored.map((mutation) => ({ ...mutation })),
      save: async (mutations) => {
        stored = mutations.map((mutation) => ({ ...mutation }));
      }
    };

    const queue = await createMutationQueue({
      storage,
      now: () => now,
      retryPolicy: {
        shouldRetry: () => true,
        nextDelayMs: () => 75
      }
    });

    queue.register("draft:sync", () => {
      throw new Error("offline");
    });

    await queue.enqueue({
      id: "m-durable",
      type: "draft:sync",
      payload: { draftId: "d1" },
      maxRetries: 3
    });

    const first = await queue.flush();
    expect(first.retried).toBe(1);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: "m-durable",
      attempts: 1,
      nextRetryAt: 1_075,
      status: "pending"
    });

    now = 1_050;
    const rehydratedBeforeWindow = await createMutationQueue({
      storage,
      now: () => now
    });

    rehydratedBeforeWindow.register("draft:sync", () => undefined);

    const beforeWindow = await rehydratedBeforeWindow.flush();
    expect(beforeWindow.skipped).toBe(1);
    expect(beforeWindow.flushed).toBe(0);

    now = 1_080;
    const rehydratedAfterWindow = await createMutationQueue({
      storage,
      now: () => now
    });

    const handled: unknown[] = [];
    rehydratedAfterWindow.register("draft:sync", (payload) => {
      handled.push(payload);
      return undefined;
    });

    const afterWindow = await rehydratedAfterWindow.flush();
    expect(afterWindow.flushed).toBe(1);
    expect(afterWindow.pending).toBe(0);
    expect(handled).toEqual([{ draftId: "d1" }]);
    expect(stored).toEqual([]);
  });

  it("hydrates and persists queue state through storage adapter", async () => {
    let saved: QueuedMutation[] = [];

    const storage: MutationQueueStorage = {
      load: async () => [
        {
          id: "seed",
          type: "draft:sync",
          payload: { draftId: "a" },
          createdAt: 10,
          attempts: 0,
          maxRetries: 3,
          nextRetryAt: 10,
          status: "pending"
        }
      ],
      save: async (mutations) => {
        saved = mutations.map((mutation) => ({ ...mutation }));
      }
    };

    const queue = await createMutationQueue({ storage, now: () => 10 });
    expect(queue.pendingCount()).toBe(1);

    queue.register("draft:sync", () => {
      return undefined;
    });

    await queue.flush();

    expect(queue.pendingCount()).toBe(0);
    expect(saved).toEqual([]);
  });

  it("adapts PersistenceAdapter storage with createMutationQueueStorage", async () => {
    const state = new Map<string, unknown>();
    const storage = createMutationQueueStorage(
      {
        async getItem<T>(key: string): Promise<T | null> {
          return (state.get(key) as T | undefined) ?? null;
        },
        async setItem<T>(key: string, value: T): Promise<void> {
          state.set(key, value);
        },
        async removeItem(key: string): Promise<void> {
          state.delete(key);
        }
      },
      "queue"
    );

    await storage.save([
      {
        id: "persisted",
        type: "todo:sync",
        payload: { id: 1 },
        createdAt: 1,
        attempts: 1,
        maxRetries: 3,
        nextRetryAt: 10,
        status: "pending"
      }
    ]);

    const loaded = await storage.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe("persisted");

    await storage.clear?.();
    expect(await storage.load()).toEqual([]);
  });

  it("replaces pending mutations sharing conflict key by default", async () => {
    let nextId = 0;
    const queue = await createMutationQueue({
      createId: () => `m-${++nextId}`,
      now: () => 100
    });

    await queue.enqueue({
      type: "profile:save",
      conflictKey: "profile:1",
      payload: { name: "Ada" }
    });

    await queue.enqueue({
      type: "profile:save",
      conflictKey: "profile:1",
      payload: { name: "Grace" }
    });

    const snapshot = queue.snapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.id).toBe("m-1");
    expect(snapshot[0]?.payload).toEqual({ name: "Grace" });
  });

  it("supports custom merge strategy for conflicting mutations", async () => {
    const queue = await createMutationQueue({
      now: () => 200,
      resolveConflict: (existing, incoming) => ({
        decision: "merge",
        payload: {
          ...(existing.payload as Record<string, unknown>),
          ...(incoming.payload as Record<string, unknown>)
        }
      })
    });

    await queue.enqueue({
      type: "todo:update",
      conflictKey: "todo:1",
      payload: { title: "Draft" }
    });

    await queue.enqueue({
      type: "todo:update",
      conflictKey: "todo:1",
      payload: { completed: true }
    });

    const snapshot = queue.snapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.payload).toEqual({
      title: "Draft",
      completed: true
    });
  });
});
