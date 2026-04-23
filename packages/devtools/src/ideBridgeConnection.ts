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
import type { DevtoolsIdeBridgeManifest } from "./ideBridgeAutoAttach.js";

const DEFAULT_UPDATE_COALESCE_MS = 250;

export function installIdeBridgeConnection(
  manifest: DevtoolsIdeBridgeManifest,
  fetchImpl: typeof fetch,
  onBridgeFailure: (reason?: string) => void,
  onBridgeConnected: (connectedAt?: number | null) => void
): () => void {
  let disposed = false;
  let connected = false;
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

    const session = getDevtoolsBridge()?.exportSession(undefined, phase === "update" ? "update" : "full");
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

      if (!response.ok && phase !== "dispose") {
        const message = `VS Code live bridge request failed (${response.status}).`;
        if (phase === "ready" || shouldRecoverBridgeFromStatus(response.status)) {
          onBridgeFailure(message);
        }
        return;
      }

      if (phase === "ready") {
        const responsePayload = await parseJsonResponse(response);
        connected = true;
        onBridgeConnected(readConnectedAt(responsePayload));
      }
    } catch (error) {
      if (phase !== "dispose") {
        onBridgeFailure(error instanceof Error ? error.message : "VS Code live bridge request failed.");
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
    if (connected) {
      void send("dispose");
    }
  };

  setExtensionAIAssistantBridge(assistantBridge);
  window.addEventListener(DEVTOOLS_BRIDGE_READY_EVENT, handleReady as EventListener);
  window.addEventListener(DEVTOOLS_BRIDGE_UPDATE_EVENT, handleUpdate as EventListener);
  window.addEventListener(DEVTOOLS_BRIDGE_DISPOSE_EVENT, handleDispose as EventListener);
  void send("ready");

  return () => {
    pendingUpdate = false;
    clearPendingUpdate();
    if (connected) {
      void send("dispose");
    }
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

function readConnectedAt(payload: unknown): number | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = (payload as Record<string, unknown>).connectedAt;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}