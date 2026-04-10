import { describe, expect, it } from "vitest";
import {
  createMutationQueue,
  createMutationQueueStorage,
  type MutationQueueStorage,
  type QueuedMutation
} from "./mutationQueue";

describe("createMutationQueue", () => {
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
});
