import { describe, expect, it } from "vitest";
import {
  createForbiddenPersistenceAdapter,
  createLocalFirstProfile,
  createMemoryBucket,
  createMemoryPersistenceAdapter,
  getPersistenceAdapterMetadata,
  localStorageAdapter,
  withLocalFirstBucketMetadata,
  withPersistenceAdapterMetadata
} from "./index";

async function readBucketText(bucket: ReturnType<typeof createMemoryBucket>, key: string): Promise<string | null> {
  const entry = await bucket.get(key);
  if (!entry) {
    return null;
  }

  if (entry.data instanceof Blob) {
    return entry.data.text();
  }
  if (entry.data instanceof ArrayBuffer) {
    return new TextDecoder().decode(entry.data);
  }

  return new TextDecoder().decode(entry.data);
}

describe("createLocalFirstProfile", () => {
  it("maps policies to app-selected adapters and queue storage", async () => {
    const queueAdapter = withPersistenceAdapterMetadata(createMemoryPersistenceAdapter(), {
      kind: "indexed-db",
      name: "test-queue"
    });
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
    const uploads = withLocalFirstBucketMetadata(createMemoryBucket<{ hash: string }>(), {
      kind: "native-file-system",
      name: "test-uploads",
      durable: true
    });
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
    expect(await readBucketText(bucket, "source.csv")).toContain("id,total");
  });

  it("fails closed when a durable policy receives a best-effort bucket", () => {
    const profile = createLocalFirstProfile({
      buckets: {
        uploads: createMemoryBucket()
      },
      policies: {
        uploads: {
          bucket: "uploads",
          durability: "durable"
        }
      }
    });

    expect(() => profile.bucket("uploads")).toThrow("requires a durable bucket");
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

  it("preserves adapter metadata across policy wrappers", () => {
    const permissive = createLocalFirstProfile({
      storage: { ui: localStorageAdapter },
      policies: { ui: { storage: "ui", sensitivity: "low" } }
    });
    const wrapped = permissive.adapter("ui");

    expect(getPersistenceAdapterMetadata(wrapped).kind).toBe("local-storage");

    const strict = createLocalFirstProfile({
      storage: { wrapped },
      policies: {
        credentials: { storage: "wrapped", sensitivity: "secret" }
      }
    });

    expect(() => strict.adapter("credentials")).toThrow("cannot persist secret data in localStorage");
  });

  it("preserves bucket metadata across policy wrappers", () => {
    const durable = withLocalFirstBucketMetadata(createMemoryBucket(), {
      kind: "native-file-system",
      durable: true
    });
    const first = createLocalFirstProfile({
      buckets: { durable },
      policies: { files: { bucket: "durable" } }
    });
    const second = createLocalFirstProfile({
      buckets: { wrapped: first.bucket("files") },
      policies: { files: { bucket: "wrapped", durability: "durable" } }
    });

    expect(() => second.bucket("files")).not.toThrow();
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

  it("enforces size limits at the adapter boundary", async () => {
    const adapter = withPersistenceAdapterMetadata(createMemoryPersistenceAdapter(), {
      kind: "indexed-db",
      name: "test-size"
    });
    const profile = createLocalFirstProfile({
      storage: {
        drafts: adapter
      },
      policies: {
        drafts: {
          storage: "drafts",
          sensitivity: "business",
          maxBytes: 8
        }
      }
    });

    await expect(profile.adapter("drafts").setItem("draft", { text: "too large" }))
      .rejects.toThrow("payload exceeds maxBytes");
  });
});
