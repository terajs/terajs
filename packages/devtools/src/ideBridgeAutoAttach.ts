import {
  DEVTOOLS_BRIDGE_DISPOSE_EVENT,
  DEVTOOLS_BRIDGE_READY_EVENT,
  DEVTOOLS_BRIDGE_UPDATE_EVENT,
  getDevtoolsBridge,
  type DevtoolsBridgeEventPhase,
} from "./devtoolsBridge.js";
import {
  EXTENSION_AI_ASSISTANT_BRIDGE_CHANGE_EVENT,
  setExtensionAIAssistantBridge,
  type ExtensionAIAssistantBridge,
} from "./providers/extensionBridge.js";

const DEFAULT_AUTO_ATTACH_ENDPOINT = "/_terajs/devtools/bridge";
const DEFAULT_POLL_MS = 2000;
const DEFAULT_UPDATE_COALESCE_MS = 250;

type DevtoolsIdeBridgeMode = "discovering" | "attached" | "recovering";

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
let pollHandle: number | null = null;
let polling = false;
let activeOptions: NormalizedAutoAttachOptions | null = null;
let activeMode: DevtoolsIdeBridgeMode = "discovering";
let refreshRequested = false;

export function autoAttachVsCodeDevtoolsBridge(
  options: DevtoolsIdeAutoAttachOptions = {}
): () => void {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined" || typeof fetch !== "function") {
    return () => {};
  }

  const normalized = normalizeAutoAttachOptions(options);
  if (pollHandle !== null) {
    stopAutoAttachVsCodeDevtoolsBridge();
  }

  activeOptions = normalized;
  activeMode = "discovering";
  refreshRequested = false;
  void syncBridgeManifest();

  return stopAutoAttachVsCodeDevtoolsBridge;
}

export function stopAutoAttachVsCodeDevtoolsBridge(): void {
  clearBridgeManifestSync();
  activeOptions = null;
  activeSignature = null;
  activeMode = "discovering";
  refreshRequested = false;
  polling = false;
  activeCleanup?.();
  activeCleanup = null;
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
  try {
    const manifest = await readBridgeManifest(activeOptions);
    if (!manifest) {
      uninstallActiveBridge();
      activeMode = "discovering";
      scheduleBridgeManifestSync(activeOptions.pollMs);
      return;
    }

    const nextSignature = `${manifest.session}|${manifest.ai}|${manifest.reveal ?? ""}`;
    const shouldInstall = nextSignature !== activeSignature || activeMode === "recovering" || !activeCleanup;
    if (!shouldInstall) {
      activeMode = "attached";
      return;
    }

    installBridge(manifest, activeOptions.fetchImpl, requestBridgeRecovery);
    activeSignature = nextSignature;
    activeMode = "attached";
  } finally {
    polling = false;
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

  pollHandle = window.setTimeout(() => {
    pollHandle = null;
    void syncBridgeManifest();
  }, Math.max(0, delayMs));
}

function requestBridgeRecovery(): void {
  if (!activeOptions) {
    return;
  }

  activeMode = "recovering";
  refreshRequested = true;
  if (polling) {
    return;
  }

  void syncBridgeManifest();
}

async function readBridgeManifest(
  options: NormalizedAutoAttachOptions
): Promise<DevtoolsIdeBridgeManifest | null> {
  try {
    const response = await options.fetchImpl(options.endpoint, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
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

function installBridge(
  manifest: DevtoolsIdeBridgeManifest,
  fetchImpl: typeof fetch,
  onBridgeFailure: () => void
): void {
  uninstallActiveBridge();

  let disposed = false;
  let lastPayload = "";
  let sendInFlight = false;
  let pendingUpdate = false;
  let pendingUpdateHandle: number | null = null;
  const revealUrl = manifest.reveal;
  const assistantBridge: ExtensionAIAssistantBridge = {
    label: "VS Code AI/Copilot",
    revealSession: revealUrl
      ? async () => {
        let response: Response;
        try {
          response = await fetchImpl(revealUrl, {
            method: "POST",
            mode: "cors"
          });
        } catch (error) {
          onBridgeFailure();
          throw error;
        }

        if (!response.ok) {
          if (shouldRecoverBridgeFromStatus(response.status)) {
            onBridgeFailure();
          }
          throw new Error(`VS Code live session reveal failed (${response.status}).`);
        }
      }
      : undefined,
    request: async (request) => {
      let response: Response;
      try {
        response = await fetchImpl(manifest.ai, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json;charset=UTF-8"
          },
          body: JSON.stringify(request)
        });
      } catch (error) {
        onBridgeFailure();
        throw error;
      }

      const payload = await parseJsonResponse(response);
      if (!response.ok) {
        if (shouldRecoverBridgeFromStatus(response.status)) {
          onBridgeFailure();
        }
        const payloadRecord = payload && typeof payload === "object" && !Array.isArray(payload)
          ? payload as Record<string, unknown>
          : null;
        const message = payloadRecord && typeof payloadRecord.error === "string"
          ? payloadRecord.error
          : `VS Code AI bridge request failed (${response.status}).`;
        throw new Error(message);
      }

      return payload;
    }
  };

  const clearPendingUpdate = (): void => {
    if (pendingUpdateHandle !== null && typeof window !== "undefined") {
      window.clearTimeout(pendingUpdateHandle);
    }

    pendingUpdateHandle = null;
  };

  const scheduleUpdate = (): void => {
    if (disposed || typeof window === "undefined") {
      return;
    }

    pendingUpdate = true;
    if (pendingUpdateHandle !== null) {
      return;
    }

    pendingUpdateHandle = window.setTimeout(() => {
      pendingUpdateHandle = null;
      if (!pendingUpdate || disposed) {
        return;
      }

      pendingUpdate = false;
      void send("update");
    }, DEFAULT_UPDATE_COALESCE_MS);
  };

  const send = async (phase: DevtoolsBridgeEventPhase): Promise<void> => {
    if (disposed && phase !== "dispose") {
      return;
    }

    const session = getDevtoolsBridge()?.exportSession();
    if (!session) {
      return;
    }

    const payload = JSON.stringify({ phase, session });
    if (phase === "update" && payload === lastPayload) {
      return;
    }

    if (phase === "update" && sendInFlight) {
      pendingUpdate = true;
      return;
    }

    sendInFlight = true;
    lastPayload = payload;
    try {
      const response = await fetchImpl(manifest.session, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        },
        body: payload
      });

      if (!response.ok && phase !== "dispose" && shouldRecoverBridgeFromStatus(response.status)) {
        onBridgeFailure();
      }
    } catch {
      if (phase !== "dispose") {
        onBridgeFailure();
      }
    } finally {
      sendInFlight = false;
      if (phase === "update" && pendingUpdate && pendingUpdateHandle === null && !disposed) {
        scheduleUpdate();
      }
    }
  };

  const handleReady = () => { void send("ready"); };
  const handleUpdate = () => { scheduleUpdate(); };
  const handleDispose = () => {
    pendingUpdate = false;
    clearPendingUpdate();
    void send("dispose");
  };

  setExtensionAIAssistantBridge(assistantBridge);
  window.addEventListener(DEVTOOLS_BRIDGE_READY_EVENT, handleReady as EventListener);
  window.addEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, handleUpdate as EventListener);
  window.addEventListener(DEVTOOLS_BRIDGE_DISPOSE_EVENT, handleDispose as EventListener);
  void send("ready");

  activeCleanup = () => {
    pendingUpdate = false;
    clearPendingUpdate();
    void send("dispose");
    disposed = true;
    window.removeEventListener(DEVTOOLS_BRIDGE_READY_EVENT, handleReady as EventListener);
    window.removeEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, handleUpdate as EventListener);
    window.removeEventListener(DEVTOOLS_BRIDGE_DISPOSE_EVENT, handleDispose as EventListener);

    if (globalThis.__TERAJS_VSCODE_AI_ASSISTANT__ === assistantBridge) {
      delete globalThis.__TERAJS_VSCODE_AI_ASSISTANT__;
      window.dispatchEvent(new CustomEvent(EXTENSION_AI_ASSISTANT_BRIDGE_CHANGE_EVENT));
    }
  };
}

function uninstallActiveBridge(): void {
  activeCleanup?.();
  activeCleanup = null;
  activeSignature = null;
}

function shouldRecoverBridgeFromStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 404 || status === 410;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { response: rawText };
  }
}