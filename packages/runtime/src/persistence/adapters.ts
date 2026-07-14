import type {
  AtomicPersistenceAdapter,
  PersistenceAdapter,
  PersistenceAdapterMetadata
} from "./types.js";

const adapterMetadata = new WeakMap<PersistenceAdapter, PersistenceAdapterMetadata>();

export function withPersistenceAdapterMetadata<TAdapter extends PersistenceAdapter>(
  adapter: TAdapter,
  metadata: PersistenceAdapterMetadata
): TAdapter {
  adapterMetadata.set(adapter, metadata);
  return adapter;
}

export function getPersistenceAdapterMetadata(
  adapter: PersistenceAdapter
): PersistenceAdapterMetadata {
  return adapterMetadata.get(adapter) ?? { kind: "custom" };
}

export const localStorageAdapter: PersistenceAdapter = withPersistenceAdapterMetadata({
  async getItem(key) {
    try {
      const val = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  async removeItem(key) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  }
}, {
  kind: "local-storage",
  name: "localStorage",
  maxRecommendedBytes: 100_000,
  durable: false
});

export function createMemoryPersistenceAdapter(
  seed: Record<string, unknown> = {}
): AtomicPersistenceAdapter {
  const state = new Map<string, unknown>(Object.entries(seed));

  return withPersistenceAdapterMetadata({
    async getItem<T>(key: string): Promise<T | null> {
      return state.has(key) ? state.get(key) as T : null;
    },
    async setItem<T>(key: string, value: T): Promise<void> {
      state.set(key, value);
    },
    async removeItem(key: string): Promise<void> {
      state.delete(key);
    },
    async updateItem<T>(
      key: string,
      update: (current: T | null) => T | null
    ): Promise<T | null> {
      const current = state.has(key) ? state.get(key) as T : null;
      const next = update(current);
      if (next === null) {
        state.delete(key);
      } else {
        state.set(key, next);
      }
      return next;
    }
  }, {
    kind: "memory",
    name: "memory",
    durable: false
  });
}

export function createForbiddenPersistenceAdapter(
  message = "Local persistence is disabled for this data class."
): PersistenceAdapter {
  const fail = async (): Promise<never> => {
    throw new Error(message);
  };

  return withPersistenceAdapterMetadata({
    getItem: fail,
    setItem: fail,
    removeItem: fail
  }, {
    kind: "forbidden",
    name: "forbidden",
    durable: false
  });
}

export interface IndexedDBPersistenceAdapterOptions {
  databaseName?: string;
  storeName?: string;
  version?: number;
}

export function createIndexedDBPersistenceAdapter(
  options: IndexedDBPersistenceAdapterOptions = {}
): AtomicPersistenceAdapter {
  const databaseName = options.databaseName ?? "terajs-local-first";
  const storeName = options.storeName ?? "key-value";
  const version = options.version ?? 1;

  const openDatabase = (): Promise<IDBDatabase> => {
    if (typeof indexedDB === "undefined") {
      return Promise.reject(new Error("IndexedDB is not available in this environment."));
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
      request.onsuccess = () => resolve(request.result);
    });
  };

  const transact = async <T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T> | void
  ): Promise<T | undefined> => {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = run(store);
      let value: T | undefined;

      if (request) {
        request.onsuccess = () => {
          value = request.result;
        };
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
      }

      transaction.oncomplete = () => {
        db.close();
        resolve(value);
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error ?? new Error("IndexedDB transaction failed."));
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
      };
    });
  };

  return withPersistenceAdapterMetadata({
    async getItem<T>(key: string): Promise<T | null> {
      const value = await transact<T>("readonly", (store) => store.get(key));
      return value === undefined ? null : value;
    },
    async setItem<T>(key: string, value: T): Promise<void> {
      await transact("readwrite", (store) => store.put(value, key));
    },
    async removeItem(key: string): Promise<void> {
      await transact("readwrite", (store) => store.delete(key));
    },
    async updateItem<T>(
      key: string,
      update: (current: T | null) => T | null
    ): Promise<T | null> {
      const db = await openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        let next: T | null = null;
        let updateError: unknown;

        request.onsuccess = () => {
          try {
            next = update(request.result === undefined ? null : request.result as T);
            if (next === null) {
              store.delete(key);
            } else {
              store.put(next, key);
            }
          } catch (error) {
            updateError = error;
            transaction.abort();
          }
        };
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
        transaction.oncomplete = () => {
          db.close();
          resolve(next);
        };
        transaction.onerror = () => {
          db.close();
          reject(updateError ?? transaction.error ?? new Error("IndexedDB transaction failed."));
        };
        transaction.onabort = () => {
          db.close();
          reject(updateError ?? transaction.error ?? new Error("IndexedDB transaction aborted."));
        };
      });
    }
  }, {
    kind: "indexed-db",
    name: databaseName,
    durable: true
  });
}
