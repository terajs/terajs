import { vi } from "vitest";

export const OVERLAY_PREFERENCES_STORAGE_KEY = "terajs:devtools:overlay-preferences";

export function appendTestHeadNode(node: HTMLElement): () => void {
  node.setAttribute("data-devtools-doc-test", "true");
  document.head.appendChild(node);
  return () => node.remove();
}

export function ensureTestStorage(): Storage {
  const candidate = (window as Window & { localStorage?: unknown }).localStorage;
  if (
    candidate
    && typeof (candidate as Storage).getItem === "function"
    && typeof (candidate as Storage).setItem === "function"
    && typeof (candidate as Storage).removeItem === "function"
  ) {
    return candidate as Storage;
  }

  const store = new Map<string, string>();
  const fallback: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    }
  };

  Object.defineProperty(window, "localStorage", {
    value: fallback,
    configurable: true
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: fallback,
    configurable: true
  });

  return fallback;
}

export function installClipboardMock() {
  const writeText = vi.fn(async (_value: string) => {});
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText },
    configurable: true
  });
  return { writeText };
}

export async function flushMicrotasks(count = 8): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await Promise.resolve();
  }
}