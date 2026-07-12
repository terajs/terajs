import { Debug } from "@terajs/shared";
import type { PersistenceAdapter } from "./persistence/types.js";
import { getPersistenceAdapterMetadata } from "./persistence/adapters.js";
import type { LocalFirstBucket } from "./persistence/buckets.js";
import { createMutationQueueStorage, type MutationQueueStorage } from "./queue/mutationQueue.js";

export type LocalFirstSensitivity = "low" | "business" | "financial" | "secret";
export type LocalFirstDurability = "best-effort" | "durable";
export type LocalFirstSyncMode = "none" | "queued" | "manual";

export interface LocalFirstPolicy {
  storage?: string;
  bucket?: string;
  sensitivity?: LocalFirstSensitivity;
  durability?: LocalFirstDurability;
  sync?: LocalFirstSyncMode;
  local?: boolean;
  maxBytes?: number;
  allowUnsafeLocalStorage?: boolean;
}

export interface LocalFirstProfileOptions<TPolicyName extends string = string> {
  storage?: Record<string, PersistenceAdapter>;
  buckets?: Record<string, LocalFirstBucket>;
  policies: Record<TPolicyName, LocalFirstPolicy>;
}

export interface LocalFirstProfile<TPolicyName extends string = string> {
  policy(name: TPolicyName): LocalFirstPolicy;
  adapter(name: TPolicyName): PersistenceAdapter;
  bucket(name: TPolicyName): LocalFirstBucket;
  queueStorage(name: TPolicyName, key?: string): MutationQueueStorage;
  assertCanPersist(name: TPolicyName, value?: unknown): void;
}

export function createLocalFirstProfile<TPolicyName extends string = string>(
  options: LocalFirstProfileOptions<TPolicyName>
): LocalFirstProfile<TPolicyName> {
  const policies = options.policies;
  const storage = options.storage ?? {};
  const buckets = options.buckets ?? {};

  const getPolicy = (name: TPolicyName): LocalFirstPolicy => {
    const policy = policies[name];
    if (!policy) {
      throw new Error(`Unknown local-first policy: ${name}`);
    }

    return policy;
  };

  const getAdapter = (name: TPolicyName): PersistenceAdapter => {
    const policy = getPolicy(name);
    if (policy.local === false) {
      throw new Error(`Local persistence is disabled for policy "${name}".`);
    }
    if (!policy.storage) {
      throw new Error(`Policy "${name}" does not declare a key-value storage adapter.`);
    }

    const adapter = storage[policy.storage];
    if (!adapter) {
      throw new Error(`Policy "${name}" references missing storage adapter "${policy.storage}".`);
    }

    assertPolicyAllowsAdapter(name, policy, adapter);
    return adapter;
  };

  const getBucket = (name: TPolicyName): LocalFirstBucket => {
    const policy = getPolicy(name);
    if (policy.local === false) {
      throw new Error(`Local persistence is disabled for policy "${name}".`);
    }
    if (!policy.bucket) {
      throw new Error(`Policy "${name}" does not declare a bucket.`);
    }

    const bucket = buckets[policy.bucket];
    if (!bucket) {
      throw new Error(`Policy "${name}" references missing bucket "${policy.bucket}".`);
    }

    return bucket;
  };

  return {
    policy: getPolicy,
    adapter: getAdapter,
    bucket: getBucket,
    queueStorage(name, key) {
      const policy = getPolicy(name);
      const adapter = getAdapter(name);
      return createMutationQueueStorage(adapter, key ?? `terajs:${String(name)}:queue`);
    },
    assertCanPersist(name, value) {
      const policy = getPolicy(name);
      const adapter = policy.storage ? getAdapter(name) : undefined;
      if (adapter) {
        assertPolicyAllowsAdapter(name, policy, adapter);
      }

      const maxBytes = policy.maxBytes;
      if (maxBytes !== undefined && estimateJsonBytes(value) > maxBytes) {
        throw new Error(`Policy "${name}" payload exceeds maxBytes (${maxBytes}).`);
      }

      Debug.emit("local-first:policy", {
        name,
        storage: policy.storage ?? null,
        bucket: policy.bucket ?? null,
        sensitivity: policy.sensitivity ?? "low",
        durability: policy.durability ?? "best-effort",
        sync: policy.sync ?? "none"
      });
    }
  };
}

function assertPolicyAllowsAdapter(
  name: string,
  policy: LocalFirstPolicy,
  adapter: PersistenceAdapter
): void {
  const metadata = getPersistenceAdapterMetadata(adapter);
  const sensitivity = policy.sensitivity ?? "low";

  if (metadata.kind === "forbidden") {
    throw new Error(`Policy "${name}" uses forbidden local persistence.`);
  }

  if (
    metadata.kind === "local-storage"
    && sensitivity !== "low"
    && policy.allowUnsafeLocalStorage !== true
  ) {
    throw new Error(
      `Policy "${name}" cannot persist ${sensitivity} data in localStorage. Use IndexedDB, OPFS, or an app-owned adapter.`
    );
  }
}

function estimateJsonBytes(value: unknown): number {
  if (value === undefined) {
    return 0;
  }

  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
