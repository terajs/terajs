export interface PersistenceAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
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
}
