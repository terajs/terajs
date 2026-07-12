import { describe, expect, it } from "vitest";
import {
  createForbiddenPersistenceAdapter,
  createLocalFirstProfile,
  createMemoryBucket,
  createMemoryPersistenceAdapter,
  getPersistenceAdapterMetadata,
  localStorageAdapter
} from "./index";

describe("createLocalFirstProfile", () => {
  it("maps policies to app-selected adapters and queue storage", async () => {
    const queueAdapter = createMemoryPersistenceAdapter();
    const profile = createLocalFirstProfile({
      storage: {
        queue: queueAdapter
      },
      policies: {
        decisions: {
          storage: "queue",
          sensitivity: "business",
          durability: "durable",
          sync: "queued"
        }
      }
    });

    const storage = profile.queueStorage("decisions", "queue");
    await storage.save([
      {
        id: "m1",
        type: "decision:save",
        payload: { id: 1 },
        createdAt: 1,
        attempts: 0,
        maxRetries: 3,
        nextRetryAt: 1,
        status: "pending"
      }
    ]);

    expect(await storage.load()).toEqual([
      expect.objectContaining({
        id: "m1",
        type: "decision:save"
      })
    ]);
  });

  it("keeps file payloads in buckets instead of queue payload storage", async () => {
    const uploads = createMemoryBucket<{ hash: string }>();
    const profile = createLocalFirstProfile({
      buckets: {
        uploads
      },
      policies: {
        uploads: {
          bucket: "uploads",
          sensitivity: "financial",
          durability: "durable",
          sync: "queued"
        }
      }
    });

    const bucket = profile.bucket("uploads");
    await bucket.put("source.csv", new Blob(["id,total\n1,5"]), {
      metadata: { hash: "sha256:demo" },
      updatedAt: 10
    });

    expect(await bucket.list()).toEqual([
      {
        key: "source.csv",
        metadata: { hash: "sha256:demo" },
        updatedAt: 10
      }
    ]);
    expect(await (await bucket.get("source.csv"))?.data.text()).toContain("id,total");
  });

  it("fails closed for sensitive policies that try to use localStorage", () => {
    const profile = createLocalFirstProfile({
      storage: {
        ui: localStorageAdapter
      },
      policies: {
        credentials: {
          storage: "ui",
          sensitivity: "secret",
          durability: "durable"
        }
      }
    });

    expect(() => profile.adapter("credentials")).toThrow("cannot persist secret data in localStorage");
  });

  it("supports explicit forbidden adapters for non-local data classes", () => {
    const adapter = createForbiddenPersistenceAdapter("credentials are server-only");
    expect(getPersistenceAdapterMetadata(adapter).kind).toBe("forbidden");

    const profile = createLocalFirstProfile({
      storage: {
        secrets: adapter
      },
      policies: {
        credentials: {
          storage: "secrets",
          sensitivity: "secret"
        }
      }
    });

    expect(() => profile.adapter("credentials")).toThrow("Policy \"credentials\" uses forbidden local persistence");
  });
});
