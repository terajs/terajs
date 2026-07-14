import type { PersistenceAdapter } from "./types.js";

export type LocalFirstBucketData = Blob | ArrayBuffer | Uint8Array;

export interface LocalFirstBucketManifestEntry<TMetadata = Record<string, unknown>> {
  key: string;
  metadata?: TMetadata;
  updatedAt: number;
}

export interface LocalFirstBucketEntry<TMetadata = Record<string, unknown>> {
  key: string;
  data: LocalFirstBucketData;
  metadata?: TMetadata;
  updatedAt: number;
}

export interface LocalFirstBucketPutOptions<TMetadata = Record<string, unknown>> {
  metadata?: TMetadata;
  updatedAt?: number;
}

export interface LocalFirstBucket<TMetadata = Record<string, unknown>> {
  put(key: string, data: LocalFirstBucketData, options?: LocalFirstBucketPutOptions<TMetadata>): Promise<LocalFirstBucketEntry<TMetadata>>;
  get(key: string): Promise<LocalFirstBucketEntry<TMetadata> | null>;
  delete(key: string): Promise<void>;
  list(): Promise<Array<LocalFirstBucketManifestEntry<TMetadata>>>;
}

export type LocalFirstBucketKind =
  | "memory"
  | "opfs"
  | "native-file-system"
  | "custom";

export interface LocalFirstBucketMetadata {
  kind: LocalFirstBucketKind;
  name?: string;
  durable?: boolean;
  manifest?: boolean;
}

const bucketMetadata = new WeakMap<LocalFirstBucket<any>, LocalFirstBucketMetadata>();

export function withLocalFirstBucketMetadata<TBucket extends LocalFirstBucket<any>>(
  bucket: TBucket,
  metadata: LocalFirstBucketMetadata
): TBucket {
  bucketMetadata.set(bucket, metadata);
  return bucket;
}

export function getLocalFirstBucketMetadata(
  bucket: LocalFirstBucket<any>
): LocalFirstBucketMetadata {
  return bucketMetadata.get(bucket) ?? { kind: "custom" };
}

export function createMemoryBucket<TMetadata = Record<string, unknown>>(): LocalFirstBucket<TMetadata> {
  const entries = new Map<string, LocalFirstBucketEntry<TMetadata>>();

  return withLocalFirstBucketMetadata({
    async put(key, data, options) {
      const entry = {
        key,
        data,
        metadata: options?.metadata,
        updatedAt: options?.updatedAt ?? Date.now()
      };
      entries.set(key, entry);
      return entry;
    },
    async get(key) {
      return entries.get(key) ?? null;
    },
    async delete(key) {
      entries.delete(key);
    },
    async list() {
      return [...entries.values()].map(({ data: _data, ...entry }) => entry);
    }
  }, {
    kind: "memory",
    name: "memory",
    durable: false
  });
}

export interface ManifestedBucketOptions {
  adapter: PersistenceAdapter;
  key?: string;
}

export function createManifestedBucket<TMetadata = Record<string, unknown>>(
  bucket: LocalFirstBucket<TMetadata>,
  options: ManifestedBucketOptions
): LocalFirstBucket<TMetadata> {
  const manifestKey = options.key ?? "terajs:bucket-manifest";
  const metadata = getLocalFirstBucketMetadata(bucket);

  const loadManifest = async (): Promise<Array<LocalFirstBucketManifestEntry<TMetadata>>> => {
    const manifest = await options.adapter.getItem<Array<LocalFirstBucketManifestEntry<TMetadata>>>(manifestKey);
    return Array.isArray(manifest) ? manifest : [];
  };

  const saveManifest = async (manifest: Array<LocalFirstBucketManifestEntry<TMetadata>>): Promise<void> => {
    if (manifest.length === 0) {
      await options.adapter.removeItem(manifestKey);
      return;
    }

    await options.adapter.setItem(manifestKey, manifest);
  };

  const upsertManifestEntry = async (entry: LocalFirstBucketManifestEntry<TMetadata>): Promise<void> => {
    const manifest = await loadManifest();
    const nextManifest = [
      ...manifest.filter((item) => item.key !== entry.key),
      entry
    ].sort((left, right) => left.key.localeCompare(right.key));

    await saveManifest(nextManifest);
  };

  return withLocalFirstBucketMetadata({
    async put(key, data, options) {
      const entry = await bucket.put(key, data, options);
      await upsertManifestEntry({
        key,
        metadata: entry.metadata,
        updatedAt: entry.updatedAt
      });
      return entry;
    },
    async get(key) {
      const entry = await bucket.get(key);
      const manifestEntry = (await loadManifest()).find((item) => item.key === key);
      if (!entry) {
        return null;
      }

      return {
        ...entry,
        metadata: manifestEntry?.metadata ?? entry.metadata,
        updatedAt: manifestEntry?.updatedAt ?? entry.updatedAt
      };
    },
    async delete(key) {
      await bucket.delete(key);
      await saveManifest((await loadManifest()).filter((entry) => entry.key !== key));
    },
    async list() {
      return loadManifest();
    }
  }, {
    ...metadata,
    manifest: true
  });
}

export interface OPFSBucketOptions {
  directory?: string;
  manifestAdapter?: PersistenceAdapter;
  manifestKey?: string;
}

export function createOPFSBucket<TMetadata = Record<string, unknown>>(
  options: OPFSBucketOptions = {}
): LocalFirstBucket<TMetadata> {
  const directory = options.directory ?? "terajs-local-first";

  const getRoot = async (): Promise<FileSystemDirectoryHandle> => {
    const storage = navigator.storage as StorageManager & {
      getDirectory?: () => Promise<FileSystemDirectoryHandle>;
    };

    if (!storage?.getDirectory) {
      throw new Error("OPFS is not available in this environment.");
    }

    const root = await storage.getDirectory();
    return root.getDirectoryHandle(directory, { create: true });
  };

  const encodeKey = (key: string): string =>
    encodeURIComponent(key).replace(/%/g, "_");

  const bucket: LocalFirstBucket<TMetadata> = withLocalFirstBucketMetadata({
    async put(key, data, options) {
      const root = await getRoot();
      const handle = await root.getFileHandle(encodeKey(key), { create: true });
      const writable = await handle.createWritable();
      await writable.write(toFileSystemWriteChunk(data));
      await writable.close();

      return {
        key,
        data,
        metadata: options?.metadata,
        updatedAt: options?.updatedAt ?? Date.now()
      };
    },
    async get(key) {
      try {
        const root = await getRoot();
        const handle = await root.getFileHandle(encodeKey(key));
        const data = await handle.getFile();

        return {
          key,
          data,
          updatedAt: data.lastModified
        };
      } catch {
        return null;
      }
    },
    async delete(key) {
      const root = await getRoot();
      await root.removeEntry(encodeKey(key)).catch(() => undefined);
    },
    async list() {
      if (!options.manifestAdapter) {
        return [];
      }

      return createManifestedBucket(bucket, {
        adapter: options.manifestAdapter,
        key: options.manifestKey
      }).list();
    }
  }, {
    kind: "opfs",
    name: directory,
    durable: true,
    manifest: Boolean(options.manifestAdapter)
  });

  return options.manifestAdapter
    ? createManifestedBucket(bucket, {
      adapter: options.manifestAdapter,
      key: options.manifestKey
    })
    : bucket;
}

function toFileSystemWriteChunk(data: LocalFirstBucketData): FileSystemWriteChunkType {
  if (ArrayBuffer.isView(data)) {
    const bytes = new Uint8Array(data.byteLength);
    bytes.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    return bytes.buffer as ArrayBuffer;
  }

  return data;
}
