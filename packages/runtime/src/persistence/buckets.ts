export interface LocalFirstBucketEntry<TMetadata = Record<string, unknown>> {
  key: string;
  data: Blob;
  metadata?: TMetadata;
  updatedAt: number;
}

export interface LocalFirstBucketPutOptions<TMetadata = Record<string, unknown>> {
  metadata?: TMetadata;
  updatedAt?: number;
}

export interface LocalFirstBucket<TMetadata = Record<string, unknown>> {
  put(key: string, data: Blob, options?: LocalFirstBucketPutOptions<TMetadata>): Promise<LocalFirstBucketEntry<TMetadata>>;
  get(key: string): Promise<LocalFirstBucketEntry<TMetadata> | null>;
  delete(key: string): Promise<void>;
  list(): Promise<Array<Omit<LocalFirstBucketEntry<TMetadata>, "data">>>;
}

export function createMemoryBucket<TMetadata = Record<string, unknown>>(): LocalFirstBucket<TMetadata> {
  const entries = new Map<string, LocalFirstBucketEntry<TMetadata>>();

  return {
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
  };
}

export interface OPFSBucketOptions {
  directory?: string;
}

export function createOPFSBucket<TMetadata = Record<string, unknown>>(
  options: OPFSBucketOptions = {}
): LocalFirstBucket<TMetadata> {
  const directory = options.directory ?? "terajs-local-first";
  const manifest = createMemoryBucket<TMetadata>();

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

  return {
    async put(key, data, options) {
      const root = await getRoot();
      const handle = await root.getFileHandle(encodeKey(key), { create: true });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();

      return manifest.put(key, data, options);
    },
    async get(key) {
      const entry = await manifest.get(key);
      if (!entry) {
        return null;
      }

      const root = await getRoot();
      const handle = await root.getFileHandle(encodeKey(key));
      const data = await handle.getFile();

      return {
        ...entry,
        data
      };
    },
    async delete(key) {
      const root = await getRoot();
      await root.removeEntry(encodeKey(key));
      await manifest.delete(key);
    },
    async list() {
      return manifest.list();
    }
  };
}
