import { describe, expect, it } from "vitest";
import {
  createManifestedBucket,
  createMemoryBucket,
  createOPFSBucket,
  encodeOPFSKey
} from "./buckets";
import {
  createMemoryPersistenceAdapter,
  withPersistenceAdapterMetadata
} from "./adapters";
import type { LocalFirstBucket } from "./buckets";
import type { AtomicPersistenceAdapter } from "./types";

function createDurableMemoryPersistenceAdapter(): AtomicPersistenceAdapter {
  return withPersistenceAdapterMetadata(createMemoryPersistenceAdapter(), {
    kind: "custom",
    name: "durable-test-manifest",
    durable: true
  });
}

async function readBucketText(bucket: LocalFirstBucket, key: string): Promise<string | null> {
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

function runBucketConformanceSuite(
  name: string,
  createBucket: () => LocalFirstBucket<{ hash: string }>
): void {
  describe(name, () => {
    it("stores, lists, reads, and deletes entries", async () => {
      const bucket = createBucket();

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

      await bucket.delete("source.csv");

      expect(await bucket.get("source.csv")).toBeNull();
      expect(await bucket.list()).toEqual([]);
    });
  });
}

runBucketConformanceSuite("createMemoryBucket", () => createMemoryBucket());

describe("createManifestedBucket", () => {
  runBucketConformanceSuite("manifested memory bucket", () =>
    createManifestedBucket(createMemoryBucket(), {
      adapter: createMemoryPersistenceAdapter(),
      key: "manifest"
    })
  );

  it("persists manifest metadata across wrapper recreation", async () => {
    const adapter = createMemoryPersistenceAdapter();
    const bytes = createMemoryBucket<{ hash: string }>();

    const first = createManifestedBucket(bytes, {
      adapter,
      key: "uploads"
    });

    await first.put("upload.csv", new Blob(["a,b"]), {
      metadata: { hash: "sha256:1" },
      updatedAt: 20
    });

    const second = createManifestedBucket(bytes, {
      adapter,
      key: "uploads"
    });

    expect(await second.list()).toEqual([
      {
        key: "upload.csv",
        metadata: { hash: "sha256:1" },
        updatedAt: 20
      }
    ]);
    expect(await readBucketText(second, "upload.csv")).toBe("a,b");
  });

  it("serializes concurrent manifest updates", async () => {
    const bucket = createManifestedBucket(createMemoryBucket(), {
      adapter: createMemoryPersistenceAdapter(),
      key: "concurrent"
    });

    await Promise.all([
      bucket.put("a", new Blob(["a"]), { updatedAt: 1 }),
      bucket.put("b", new Blob(["b"]), { updatedAt: 2 })
    ]);

    expect(await bucket.list()).toEqual([
      { key: "a", metadata: undefined, updatedAt: 1 },
      { key: "b", metadata: undefined, updatedAt: 2 }
    ]);
  });

  it("preserves concurrent updates across separate wrappers sharing a manifest", async () => {
    const state = new Map<string, unknown>();
    let transaction = Promise.resolve();
    const createAdapter = (): AtomicPersistenceAdapter => ({
      async getItem<T>(key: string): Promise<T | null> {
        return state.has(key) ? state.get(key) as T : null;
      },
      async setItem<T>(key: string, value: T): Promise<void> {
        await Promise.resolve();
        state.set(key, value);
      },
      async removeItem(key: string): Promise<void> {
        state.delete(key);
      },
      async updateItem<T>(key: string, update: (current: T | null) => T | null): Promise<T | null> {
        let updated: T | null = null;
        const operation = transaction.then(async () => {
          const current = state.has(key) ? state.get(key) as T : null;
          updated = update(current);
          await Promise.resolve();
          if (updated === null) {
            state.delete(key);
          } else {
            state.set(key, updated);
          }
        });
        transaction = operation.catch(() => undefined);
        await operation;
        return updated;
      }
    });
    const first = createManifestedBucket(createMemoryBucket(), {
      adapter: createAdapter(),
      key: "shared"
    });
    const second = createManifestedBucket(createMemoryBucket(), {
      adapter: createAdapter(),
      key: "shared"
    });

    await Promise.all([
      first.put("a", new Blob(["a"]), { updatedAt: 1 }),
      second.put("b", new Blob(["b"]), { updatedAt: 2 })
    ]);

    expect(await first.list()).toEqual([
      { key: "a", metadata: undefined, updatedAt: 1 },
      { key: "b", metadata: undefined, updatedAt: 2 }
    ]);
  });
});

describe("createOPFSBucket", () => {
  it("fails closed without atomic manifest storage", () => {
    expect(() => createOPFSBucket({ manifestAdapter: undefined as never }))
      .toThrow("require an atomic manifestAdapter");
  });

  it("rejects volatile manifests instead of advertising a durable bucket", () => {
    expect(() => createOPFSBucket({
      manifestAdapter: createMemoryPersistenceAdapter()
    })).toThrow("require a durable manifestAdapter");
  });

  it("encodes previously colliding keys distinctly", () => {
    expect(encodeOPFSKey("a/b")).not.toBe(encodeOPFSKey("a_2Fb"));
    expect(encodeOPFSKey("/")).not.toBe(encodeOPFSKey("_2F"));
  });

  it("propagates OPFS deletion errors other than NotFoundError", async () => {
    const removeEntry = async () => {
      throw new DOMException("denied", "SecurityError");
    };
    const directory = {
      removeEntry,
      getFileHandle: async () => { throw new Error("unused"); }
    };
    const root = { getDirectoryHandle: async () => directory };
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { storage: { getDirectory: async () => root } }
    });

    try {
      const bucket = createOPFSBucket({
        manifestAdapter: createDurableMemoryPersistenceAdapter()
      });
      await expect(bucket.delete("file")).rejects.toThrow("denied");
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: originalNavigator
      });
    }
  });
});
