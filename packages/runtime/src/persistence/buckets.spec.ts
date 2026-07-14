import { describe, expect, it } from "vitest";
import {
  createManifestedBucket,
  createMemoryBucket
} from "./buckets";
import { createMemoryPersistenceAdapter } from "./adapters";
import type { LocalFirstBucket } from "./buckets";

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
});
