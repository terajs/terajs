import type { DevtoolsAIAssistantOptions, DevtoolsBridgeOptions } from "./app.js";

export type DevtoolsOverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
export type DevtoolsOverlaySize = "normal" | "large";

/**
 * Configuration for the Terajs DevTools overlay.
 */
export interface DevtoolsOverlayOptions {
  startOpen?: boolean;
  position?: DevtoolsOverlayPosition;
  panelSize?: DevtoolsOverlaySize;
  persistPreferences?: boolean;
  panelShortcut?: string;
  visibilityShortcut?: string;
  ai?: DevtoolsAIAssistantOptions;
  bridge?: DevtoolsBridgeOptions;
}

export interface NormalizedOverlayOptions {
  startOpen: boolean;
  position: DevtoolsOverlayPosition;
  panelSize: DevtoolsOverlaySize;
  persistPreferences: boolean;
  panelShortcut: string;
  visibilityShortcut: string;
  ai: {
    enabled: boolean;
    endpoint: string;
    model: string;
    timeoutMs: number;
  };
  bridge: {
    enabled: boolean;
  };
}

export interface OverlayPreferencesPayload {
  position?: DevtoolsOverlayPosition;
  panelSize?: DevtoolsOverlaySize;
  persistPreferences?: boolean;
}

interface OverlayStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const OVERLAY_PREFERENCES_STORAGE_KEY = "terajs:devtools:overlay-preferences";

const DEFAULT_OPTIONS: NormalizedOverlayOptions = {
  startOpen: false,
  position: "bottom-center",
  panelSize: "normal",
  persistPreferences: true,
  panelShortcut: "Ctrl+Shift+D",
  visibilityShortcut: "Ctrl+Shift+H",
  ai: {
    enabled: true,
    endpoint: "",
    model: "terajs-assistant",
    timeoutMs: 12000
  },
  bridge: {
    enabled: process.env.NODE_ENV !== "production"
  }
};

export function getDefaultOverlayOptions(): NormalizedOverlayOptions {
  return {
    ...DEFAULT_OPTIONS,
    ai: { ...DEFAULT_OPTIONS.ai },
    bridge: { ...DEFAULT_OPTIONS.bridge }
  };
}

export function isOverlayPosition(value: unknown): value is DevtoolsOverlayPosition {
  return value === "bottom-left"
    || value === "bottom-right"
    || value === "bottom-center"
    || value === "top-left"
    || value === "top-right"
    || value === "top-center"
    || value === "center";
}

export function isOverlaySize(value: unknown): value is DevtoolsOverlaySize {
  return value === "normal" || value === "large";
}

function getOverlayStorage(): OverlayStorage | null {
  const windowStorage = typeof window !== "undefined"
    ? (window as Window & { localStorage?: unknown }).localStorage
    : undefined;
  const globalStorage = (globalThis as typeof globalThis & { localStorage?: unknown }).localStorage;

  const candidates = [windowStorage, globalStorage];
  for (const candidate of candidates) {
    if (
      candidate
      && typeof (candidate as OverlayStorage).getItem === "function"
      && typeof (candidate as OverlayStorage).setItem === "function"
      && typeof (candidate as OverlayStorage).removeItem === "function"
    ) {
      return candidate as OverlayStorage;
    }
  }

  return null;
}

function loadPersistedOverlayPreferences(): OverlayPreferencesPayload {
  const storage = getOverlayStorage();
  if (!storage) {
    return {};
  }

  try {
    const raw = storage.getItem(OVERLAY_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const position = parsed.position;
    const panelSize = parsed.panelSize;

    return {
      position: isOverlayPosition(position) ? position : undefined,
      panelSize: isOverlaySize(panelSize) ? panelSize : undefined
    };
  } catch {
    return {};
  }
}

export function savePersistedOverlayPreferences(
  options: Pick<NormalizedOverlayOptions, "position" | "panelSize" | "persistPreferences">
): void {
  const storage = getOverlayStorage();
  if (!storage || !options.persistPreferences) {
    return;
  }

  try {
    storage.setItem(OVERLAY_PREFERENCES_STORAGE_KEY, JSON.stringify({
      position: options.position,
      panelSize: options.panelSize
    }));
  } catch {
    // Swallow storage errors so DevTools remains interactive in restricted contexts.
  }
}

export function clearPersistedOverlayPreferences(): void {
  const storage = getOverlayStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(OVERLAY_PREFERENCES_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures in restricted contexts.
  }
}

function normalizeAIAssistantOptions(options?: DevtoolsAIAssistantOptions): NormalizedOverlayOptions["ai"] {
  const endpoint = typeof options?.endpoint === "string" && options.endpoint.trim().length > 0
    ? options.endpoint.trim()
    : "";

  const model = typeof options?.model === "string" && options.model.trim().length > 0
    ? options.model.trim()
    : DEFAULT_OPTIONS.ai.model;

  const timeoutMs = typeof options?.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
    ? Math.min(60000, Math.max(1500, Math.round(options.timeoutMs)))
    : DEFAULT_OPTIONS.ai.timeoutMs;

  return {
    enabled: options?.enabled !== false,
    endpoint,
    model,
    timeoutMs
  };
}

export function normalizeOverlayOptions(options?: DevtoolsOverlayOptions): NormalizedOverlayOptions {
  const startOpen = typeof options?.startOpen === "boolean"
    ? options.startOpen
    : DEFAULT_OPTIONS.startOpen;
  const position = isOverlayPosition(options?.position)
    ? options.position
    : DEFAULT_OPTIONS.position;
  const panelSize = isOverlaySize(options?.panelSize)
    ? options.panelSize
    : DEFAULT_OPTIONS.panelSize;
  const persistPreferences = options?.persistPreferences !== false;
  const panelShortcut = typeof options?.panelShortcut === "string" && options.panelShortcut.trim().length > 0
    ? options.panelShortcut.trim()
    : DEFAULT_OPTIONS.panelShortcut;
  const visibilityShortcut = typeof options?.visibilityShortcut === "string" && options.visibilityShortcut.trim().length > 0
    ? options.visibilityShortcut.trim()
    : DEFAULT_OPTIONS.visibilityShortcut;

  return {
    startOpen,
    position,
    panelSize,
    persistPreferences,
    panelShortcut,
    visibilityShortcut,
    ai: normalizeAIAssistantOptions(options?.ai),
    bridge: {
      enabled: typeof options?.bridge?.enabled === "boolean"
        ? options.bridge.enabled
        : DEFAULT_OPTIONS.bridge.enabled
    }
  };
}

export function applyPersistedOverlayOptions(
  normalized: NormalizedOverlayOptions,
  rawOptions?: DevtoolsOverlayOptions
): NormalizedOverlayOptions {
  if (!normalized.persistPreferences) {
    return normalized;
  }

  const persisted = loadPersistedOverlayPreferences();
  const usePersistedSize = !rawOptions || !isOverlaySize(rawOptions.panelSize);

  return {
    ...normalized,
    position: normalized.position,
    panelSize: usePersistedSize && persisted.panelSize
      ? persisted.panelSize
      : normalized.panelSize
  };
}