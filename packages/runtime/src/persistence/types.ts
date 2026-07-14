export interface PersistenceAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  updateItem?<T>(
    key: string,
    update: (current: T | null) => T | null
  ): Promise<T | null>;
}

export interface AtomicPersistenceAdapter extends PersistenceAdapter {
  updateItem<T>(
    key: string,
    update: (current: T | null) => T | null
  ): Promise<T | null>;
}

export type PersistenceAdapterKind =
  | "local-storage"
  | "indexed-db"
  | "memory"
  | "forbidden"
  | "custom";

export interface PersistenceAdapterMetadata {
  kind: PersistenceAdapterKind;
  name?: string;
  maxRecommendedBytes?: number;
  durable?: boolean;
}
