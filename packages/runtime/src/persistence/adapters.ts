import { PersistenceAdapter } from "./types.js";

export const localStorageAdapter: PersistenceAdapter = {
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
};
