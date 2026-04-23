import { installIdeBridgeConnection } from "./ideBridgeConnection.js";
import {
  DEVTOOLS_BRIDGE_READY_EVENT,
  DEVTOOLS_BRIDGE_UPDATE_EVENT,
  getDevtoolsBridge,
} from "./devtoolsBridge.js";

const DEFAULT_AUTO_ATTACH_ENDPOINT = "/_terajs/devtools/bridge";
const DEFAULT_POLL_MS = 2000;
export const DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT = "terajs:devtools:ide-bridge:status-change";

export type DevtoolsIdeBridgeMode =
  | "disabled"
  | "discovering"
  | "available"
  | "connecting"
  | "connected"
  | "recovering"
  | "error";

/** Snapshot of the local VS Code live-bridge controller state. */
export interface DevtoolsIdeBridgeStatus {
  mode: DevtoolsIdeBridgeMode;
  hasManifest: boolean;
  isConnected: boolean;
  connectedAt: number | null;
  lastError: string | null;
}

export interface DevtoolsIdeBridgeManifest {
  version: 1;
  session: string;
  ai: string;
  reveal: string | null;
  updatedAt: number;
}

export interface DevtoolsIdeAutoAttachOptions {
  endpoint?: string;
  pollMs?: number;
  fetchImpl?: typeof fetch;
}

interface NormalizedAutoAttachOptions {
  endpoint: string;
  pollMs: number;
  fetchImpl: typeof fetch;
}

let activeCleanup: (() => void) | null = null;
let activeSignature: string | null = null;
let activeManifestUpdatedAt = 0;
let pollHandle: number | null = null;
let polling = false;
let activeOptions: NormalizedAutoAttachOptions | null = null;
let activeManifest: DevtoolsIdeBridgeManifest | null = null;
let activeManifestController: AbortController | null = null;
let activeSessionVersion = 0;
let activeMode: DevtoolsIdeBridgeMode = "disabled";
let refreshRequested = false;
let failedSignature: string | null = null;
let failedManifestUpdatedAt = 0;
let connectionRequested = false;
let lastError: string | null = null;
let lastPublishedStatusKey = "";
let activeConnectedAt: number | null = null;
let bridgeStateListener: EventListener | null = null;

/** Returns the current local VS Code bridge controller state. */
export function getDevtoolsIdeBridgeStatus(): DevtoolsIdeBridgeStatus {
  return {
    mode: activeMode,
    hasManifest: activeManifest !== null,
    isConnected: activeMode === "connected" && activeCleanup !== null,
    connectedAt: activeConnectedAt,
    lastError
  };
}

/** Requests an explicit connection to the discovered VS Code live receiver. */
export function connectVsCodeDevtoolsBridge(): boolean {
  if (!activeOptions) {
    return false;
  }

  connectionRequested = true;
  lastError = null;
  activeMode = activeManifest ? "connecting" : "discovering";
  publishBridgeStatus();

  if (polling) {
    refreshRequested = true;
    return true;
  }

  scheduleBridgeManifestSync(0);
  return true;
}

/** Disconnects the current live session while leaving receiver discovery enabled. */
export function disconnectVsCodeDevtoolsBridge(): void {
  connectionRequested = false;
  lastError = null;
  failedSignature = null;
  failedManifestUpdatedAt = 0;
  activeConnectedAt = null;
  uninstallActiveBridge();
  clearBridgeManifestSync();
  activeMode = activeOptions
    ? activeManifest
      ? "available"
      : "discovering"
    : "disabled";
  publishBridgeStatus();
}

/** Clears a failed bridge quarantine and retries discovery and connection immediately. */
export function retryVsCodeDevtoolsBridgeConnection(): boolean {
  if (!activeOptions) {
    return false;
  }

  failedSignature = null;
  failedManifestUpdatedAt = 0;
  lastError = null;
  connectionRequested = true;
  uninstallActiveBridge();
  activeMode = activeManifest ? "connecting" : "discovering";
  publishBridgeStatus();

  if (polling) {
    refreshRequested = true;
    return true;
  }

  scheduleBridgeManifestSync(0);
  return true;
}

export function autoAttachVsCodeDevtoolsBridge(
  options: DevtoolsIdeAutoAttachOptions = {}
): () => void {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined" || typeof fetch !== "function") {
    return () => {};
  }

  const normalized = normalizeAutoAttachOptions(options);
  if (activeOptions) {
    stopAutoAttachVsCodeDevtoolsBridge();
  }

  activeSessionVersion += 1;
  activeOptions = normalized;
  activeManifest = null;
  activeMode = "disabled";
  connectionRequested = false;
  lastError = null;
  refreshRequested = false;
  setupBridgeStateSync();
  publishBridgeStatus();
  syncBridgeDiscoveryActivity();

  return stopAutoAttachVsCodeDevtoolsBridge;
}

export function stopAutoAttachVsCodeDevtoolsBridge(): void {
  activeSessionVersion += 1;
  abortActiveManifestSync();
  clearBridgeManifestSync();
  teardownBridgeStateSync();
  activeOptions = null;
  activeManifest = null;
  activeSignature = null;
  activeManifestUpdatedAt = 0;
  activeMode = "disabled";
  refreshRequested = false;
  failedSignature = null;
  failedManifestUpdatedAt = 0;
  connectionRequested = false;
  activeConnectedAt = null;
  lastError = null;
  polling = false;
  activeCleanup?.();
  activeCleanup = null;
  publishBridgeStatus();
}

function normalizeAutoAttachOptions(options: DevtoolsIdeAutoAttachOptions): NormalizedAutoAttachOptions {
  return {
    endpoint: typeof options.endpoint === "string" && options.endpoint.trim().length > 0
      ? options.endpoint.trim()
      : DEFAULT_AUTO_ATTACH_ENDPOINT,
    pollMs: typeof options.pollMs === "number" && Number.isFinite(options.pollMs)
      ? Math.max(250, Math.round(options.pollMs))
      : DEFAULT_POLL_MS,
    fetchImpl: options.fetchImpl ?? ((input, init) => fetch(input, init))
  };
}

function abortActiveManifestSync(): void {
  activeManifestController?.abort();
  activeManifestController = null;
}

function isAIDiagnosticsTabActive(): boolean {
  return getDevtoolsBridge()?.getSnapshot()?.activeTab === "AI Diagnostics";
}

function setupBridgeStateSync(): void {
  if (typeof window === "undefined" || bridgeStateListener) {
    return;
  }

  bridgeStateListener = () => {
    syncBridgeDiscoveryActivity();
  };

  window.addEventListener(DEVTOOLS_BRIDGE_READY_EVENT, bridgeStateListener);
  window.addEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, bridgeStateListener);
}

function teardownBridgeStateSync(): void {
  if (typeof window === "undefined" || !bridgeStateListener) {
    bridgeStateListener = null;
    return;
  }

  window.removeEventListener(DEVTOOLS_BRIDGE_READY_EVENT, bridgeStateListener);
  window.removeEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, bridgeStateListener);
  bridgeStateListener = null;
}

function syncBridgeDiscoveryActivity(): void {
  if (!activeOptions) {
    return;
  }

  const shouldDiscover = connectionRequested || isAIDiagnosticsTabActive();
  if (!shouldDiscover) {
    abortActiveManifestSync();
    clearBridgeManifestSync();
    refreshRequested = false;

    if (!activeCleanup) {
      activeManifest = null;
      activeSignature = null;
      activeManifestUpdatedAt = 0;
      activeMode = "disabled";
      lastError = null;
      publishBridgeStatus();
    }
    return;
  }

  if (activeMode === "disabled") {
    activeMode = activeManifest ? "available" : "discovering";
    publishBridgeStatus();
  }

  if (!activeManifest && !polling && pollHandle === null) {
    scheduleBridgeManifestSync(0);
  }
}

async function syncBridgeManifest(): Promise<void> {
  if (!activeOptions) {
    return;
  }

  if (polling) {
    refreshRequested = true;
    return;
  }

  polling = true;
  refreshRequested = false;
  const syncOptions = activeOptions;
  const syncVersion = activeSessionVersion;
  const controller = typeof AbortController === "function"
    ? new AbortController()
    : null;
  activeManifestController = controller;
  try {
    const manifest = await readBridgeManifest(syncOptions, controller?.signal);
    if (syncVersion !== activeSessionVersion || activeOptions !== syncOptions) {
      return;
    }

    if (!manifest) {
      uninstallActiveBridge();
      activeManifest = null;
      if (connectionRequested) {
        activeMode = lastError !== null || failedSignature !== null ? "recovering" : "error";
        lastError ??= "VS Code receiver is unavailable. Retry after the live session starts again.";
      } else {
        activeMode = "discovering";
      }
      publishBridgeStatus();
      return;
    }

    activeManifest = manifest;
    const nextSignature = `${manifest.session}|${manifest.ai}|${manifest.reveal ?? ""}`;
    if (nextSignature === failedSignature && manifest.updatedAt <= failedManifestUpdatedAt) {
      uninstallActiveBridge();
      activeMode = "recovering";
      publishBridgeStatus();
      return;
    }

    if (nextSignature !== failedSignature || manifest.updatedAt > failedManifestUpdatedAt) {
      failedSignature = null;
      failedManifestUpdatedAt = 0;
    }

    if (!connectionRequested) {
      lastError = null;
      activeMode = "available";
      publishBridgeStatus();
      return;
    }

    if (connectActiveManifestIfAvailable()) {
      refreshRequested = false;
      return;
    }
  } finally {
    if (activeManifestController === controller) {
      activeManifestController = null;
    }

    polling = false;
    if (syncVersion !== activeSessionVersion || activeOptions !== syncOptions) {
      return;
    }

    if (refreshRequested && activeOptions) {
      scheduleBridgeManifestSync(0);
    }
  }
}

function clearBridgeManifestSync(): void {
  if (pollHandle !== null && typeof window !== "undefined") {
    window.clearTimeout(pollHandle);
  }

  pollHandle = null;
}

function scheduleBridgeManifestSync(delayMs: number): void {
  if (!activeOptions || typeof window === "undefined") {
    return;
  }

  if (pollHandle !== null) {
    if (delayMs > 0) {
      return;
    }
    window.clearTimeout(pollHandle);
  }

  if (delayMs <= 0) {
    pollHandle = null;
    void syncBridgeManifest();
    return;
  }

  pollHandle = window.setTimeout(() => {
    pollHandle = null;
    void syncBridgeManifest();
  }, Math.max(0, delayMs));
}

function requestBridgeRecovery(reason?: string): void {
  if (!activeOptions) {
    return;
  }

  if (activeSignature) {
    failedSignature = activeSignature;
    failedManifestUpdatedAt = activeManifestUpdatedAt;
  }

  activeConnectedAt = null;
  uninstallActiveBridge();
  activeMode = "recovering";
  lastError = typeof reason === "string" && reason.trim().length > 0
    ? reason.trim()
    : "VS Code live bridge connection failed.";
  refreshRequested = false;
  publishBridgeStatus();
}

function markBridgeConnected(connectedAt: number | null = null): void {
  if (!activeOptions || !connectionRequested) {
    return;
  }

  activeConnectedAt = connectedAt ?? Date.now();
  lastError = null;
  activeMode = "connected";
  publishBridgeStatus();
}

function connectActiveManifestIfAvailable(): boolean {
  if (!activeOptions || !activeManifest) {
    return false;
  }

  const nextSignature = `${activeManifest.session}|${activeManifest.ai}|${activeManifest.reveal ?? ""}`;
  if (nextSignature === failedSignature && activeManifest.updatedAt <= failedManifestUpdatedAt) {
    uninstallActiveBridge();
    activeMode = "recovering";
    publishBridgeStatus();
    return false;
  }

  if (nextSignature !== failedSignature || activeManifest.updatedAt > failedManifestUpdatedAt) {
    failedSignature = null;
    failedManifestUpdatedAt = 0;
  }

  clearBridgeManifestSync();

  const shouldInstall = nextSignature !== activeSignature || !activeCleanup;
  if (!shouldInstall) {
    lastError = null;
    activeConnectedAt ??= Date.now();
    activeMode = "connected";
    publishBridgeStatus();
    return true;
  }

  lastError = null;
  activeMode = "connecting";
  publishBridgeStatus();
  uninstallActiveBridge();
  activeCleanup = installIdeBridgeConnection(activeManifest, activeOptions.fetchImpl, requestBridgeRecovery, markBridgeConnected);
  activeSignature = nextSignature;
  activeManifestUpdatedAt = activeManifest.updatedAt;
  return true;
}

async function readBridgeManifest(
  options: NormalizedAutoAttachOptions,
  signal?: AbortSignal
): Promise<DevtoolsIdeBridgeManifest | null> {
  try {
    const response = await options.fetchImpl(options.endpoint, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store",
      signal
    });

    if (response.status === 204 || response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const rawText = await response.text();
    if (!rawText.trim()) {
      return null;
    }

    return parseBridgeManifest(rawText);
  } catch {
    return null;
  }
}

function parseBridgeManifest(rawText: string): DevtoolsIdeBridgeManifest | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  if (record.version !== 1 || typeof record.session !== "string" || typeof record.ai !== "string") {
    return null;
  }

  return {
    version: 1,
    session: record.session,
    ai: record.ai,
    reveal: typeof record.reveal === "string" ? record.reveal : null,
    updatedAt: typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now()
  };
}

function uninstallActiveBridge(): void {
  activeCleanup?.();
  activeCleanup = null;
  activeSignature = null;
  activeManifestUpdatedAt = 0;
}

function publishBridgeStatus(): void {
  if (typeof window === "undefined") {
    return;
  }

  const status = getDevtoolsIdeBridgeStatus();
  const nextKey = `${status.mode}|${status.hasManifest ? "1" : "0"}|${status.isConnected ? "1" : "0"}|${status.connectedAt ?? ""}|${status.lastError ?? ""}`;
  if (nextKey === lastPublishedStatusKey) {
    return;
  }

  lastPublishedStatusKey = nextKey;
  window.dispatchEvent(new CustomEvent(DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT, {
    detail: status
  }));
}
