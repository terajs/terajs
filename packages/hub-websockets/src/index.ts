import {
  invalidateResources,
  type ServerFunctionCall,
  type ServerFunctionTransport
} from "@terajs/runtime";
import { Debug } from "@terajs/shared";

export type HubRetryPolicy = "none" | "exponential";

export interface HubInvalidationMessage {
  type: "invalidate";
  keys: string[];
}

export type HubMessage = HubInvalidationMessage;
export type HubMessageListener = (message: HubMessage) => void;

export interface HubTransport extends ServerFunctionTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  subscribe(listener: HubMessageListener): () => void;
}

interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(event: "open" | "close" | "error" | "message", listener: (event: unknown) => void): void;
  removeEventListener(event: "open" | "close" | "error" | "message", listener: (event: unknown) => void): void;
}

type WebSocketFactory = (url: string) => WebSocketLike;

interface WebSocketInvocationResponse {
  type?: unknown;
  requestId?: unknown;
  ok?: unknown;
  result?: unknown;
  invalidated?: unknown;
  error?: {
    message?: unknown;
  } | string;
}

interface PendingInvocation {
  callId: string;
  timeoutHandle: NodeJS.Timeout;
  resolve: (value: { result: unknown; invalidated: string[] }) => void;
  reject: (error: Error) => void;
}

export interface WebSocketHubTransportOptions {
  url: string;
  autoConnect?: boolean;
  retryPolicy?: HubRetryPolicy;
  requestTimeoutMs?: number;
  createWebSocket?: WebSocketFactory;
}

function normalizeInvalidationKeys(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload.filter((key): key is string => typeof key === "string" && key.length > 0);
  }

  if (typeof payload === "string" && payload.length > 0) {
    return [payload];
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;
    const keys = objectPayload.keys;
    if (Array.isArray(keys)) {
      return keys.filter((key): key is string => typeof key === "string" && key.length > 0);
    }
  }

  return [];
}

function normalizeInvocationResponse(payload: WebSocketInvocationResponse): {
  result: unknown;
  invalidated: string[];
} {
  if (payload.ok === false) {
    const message = typeof payload.error === "string"
      ? payload.error
      : typeof payload.error?.message === "string"
      ? payload.error.message
      : "WebSocket server function invocation failed.";
    throw new Error(message);
  }

  const invalidated = normalizeInvalidationKeys(payload.invalidated);
  if (payload.ok === true || "result" in payload) {
    return {
      result: payload.result,
      invalidated
    };
  }

  return {
    result: payload,
    invalidated
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function getDisconnectReason(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.reason === "string" && record.reason.trim().length > 0) {
      return record.reason;
    }
  }

  return "connection closed";
}

function resolveRetryDelay(attempt: number): number {
  const backoff = [300, 800, 1800, 4000, 8000];
  const index = Math.min(attempt, backoff.length - 1);
  return backoff[index];
}

function normalizePayload(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === "object") {
    return raw as Record<string, unknown>;
  }

  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object"
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function resolveWebSocketFactory(options: WebSocketHubTransportOptions): WebSocketFactory {
  if (typeof options.createWebSocket === "function") {
    return options.createWebSocket;
  }

  const ctor = (globalThis as typeof globalThis & {
    WebSocket?: new (url: string) => WebSocketLike;
  }).WebSocket;

  if (typeof ctor !== "function") {
    throw new Error(
      "WebSocket is unavailable in this environment. Provide options.createWebSocket to use sync.hub type \"websockets\"."
    );
  }

  return (url: string) => new ctor(url);
}

export async function createWebSocketHubTransport(
  options: WebSocketHubTransportOptions
): Promise<HubTransport> {
  const url = options.url.trim();
  if (!url) {
    throw new Error("WebSocket hub transport requires a non-empty url.");
  }

  const retryPolicy = options.retryPolicy ?? "exponential";
  const requestTimeoutMs = typeof options.requestTimeoutMs === "number" && Number.isFinite(options.requestTimeoutMs)
    ? Math.min(120000, Math.max(1000, Math.round(options.requestTimeoutMs)))
    : 15000;
  const createSocket = resolveWebSocketFactory(options);

  const listeners = new Set<HubMessageListener>();
  const pendingInvocations = new Map<string, PendingInvocation>();

  let socket: WebSocketLike | null = null;
  let connected = false;
  let connectPromise: Promise<void> | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let reconnectAttempt = 0;
  let manualDisconnect = false;
  let nextRequestId = 0;

  function clearReconnectTimer(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function rejectPending(reason: string): void {
    for (const [requestId, pending] of pendingInvocations) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(new Error(reason));
      pendingInvocations.delete(requestId);
    }
  }

  async function handleIncomingPayload(payload: Record<string, unknown>): Promise<void> {
    if (payload.type === "invalidate") {
      const keys = normalizeInvalidationKeys(payload.keys);
      if (keys.length === 0) {
        return;
      }

      Debug.emit("hub:push:received", {
        transport: "websockets",
        url,
        type: "invalidate",
        keys
      });

      for (const listener of listeners) {
        listener({ type: "invalidate", keys });
      }

      return;
    }

    if (payload.type !== "response" || typeof payload.requestId !== "string") {
      return;
    }

    const pending = pendingInvocations.get(payload.requestId);
    if (!pending) {
      return;
    }

    pendingInvocations.delete(payload.requestId);
    clearTimeout(pending.timeoutHandle);

    try {
      const normalized = normalizeInvocationResponse(payload as WebSocketInvocationResponse);
      if (normalized.invalidated.length > 0) {
        await invalidateResources(normalized.invalidated);
      }

      pending.resolve(normalized);
    } catch (error) {
      pending.reject(new Error(getErrorMessage(error, "WebSocket invocation failed.")));
    }
  }

  function scheduleReconnect(reason: string): void {
    if (manualDisconnect || retryPolicy === "none") {
      return;
    }

    clearReconnectTimer();
    const delay = resolveRetryDelay(reconnectAttempt);
    reconnectAttempt += 1;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void transport.connect().catch((error) => {
        Debug.emit("hub:error", {
          transport: "websockets",
          url,
          message: getErrorMessage(error, `Reconnect failed after ${reason}.`)
        });
        scheduleReconnect("retry-failed");
      });
    }, delay);
  }

  const transport: HubTransport = {
    async connect() {
      if (connected) {
        return;
      }

      if (connectPromise) {
        return connectPromise;
      }

      manualDisconnect = false;
      clearReconnectTimer();

      connectPromise = new Promise<void>((resolve, reject) => {
        let settled = false;
        let activeSocket: WebSocketLike;

        const settle = (resolver: () => void): void => {
          if (settled) {
            return;
          }

          settled = true;
          resolver();
        };

        try {
          activeSocket = createSocket(url);
        } catch (error) {
          const message = getErrorMessage(error, "Failed to create WebSocket connection.");
          settle(() => reject(new Error(message)));
          return;
        }

        socket = activeSocket;

        const onOpen = () => {
          settle(() => {
            connected = true;
            reconnectAttempt = 0;
            Debug.emit("hub:connect", {
              transport: "websockets",
              url,
              retryPolicy
            });
            resolve();
          });
        };

        const onError = (event: unknown) => {
          const message = getErrorMessage(event, "WebSocket connection failed.");
          Debug.emit("hub:error", {
            transport: "websockets",
            url,
            message
          });

          if (!connected) {
            settle(() => reject(new Error(message)));
          }
        };

        const onClose = (event: unknown) => {
          const reason = manualDisconnect ? "manual" : getDisconnectReason(event);
          const wasConnected = connected;

          connected = false;
          socket = null;
          rejectPending(`WebSocket disconnected (${reason}).`);

          if (wasConnected || reason !== "manual") {
            Debug.emit("hub:disconnect", {
              transport: "websockets",
              url,
              reason
            });
          }

          if (!manualDisconnect) {
            scheduleReconnect(reason);
            if (!settled) {
              settle(() => reject(new Error(`WebSocket closed before connect (${reason}).`)));
            }
          }
        };

        const onMessage = (event: unknown) => {
          const data = event && typeof event === "object" && "data" in (event as Record<string, unknown>)
            ? (event as Record<string, unknown>).data
            : event;
          const parsed = normalizePayload(data);
          if (!parsed) {
            return;
          }

          void handleIncomingPayload(parsed).catch((error) => {
            Debug.emit("hub:error", {
              transport: "websockets",
              url,
              message: getErrorMessage(error, "Failed to process hub payload.")
            });
          });
        };

        activeSocket.addEventListener("open", onOpen);
        activeSocket.addEventListener("error", onError);
        activeSocket.addEventListener("close", onClose);
        activeSocket.addEventListener("message", onMessage);
      }).finally(() => {
        connectPromise = null;
      });

      return connectPromise;
    },

    async disconnect() {
      manualDisconnect = true;
      clearReconnectTimer();

      if (connected) {
        connected = false;
        Debug.emit("hub:disconnect", {
          transport: "websockets",
          url,
          reason: "manual"
        });
      }

      rejectPending("WebSocket disconnected (manual).");

      const activeSocket = socket;
      socket = null;

      if (!activeSocket) {
        return;
      }

      try {
        activeSocket.close(1000, "manual");
      } catch {
        // Ignore close errors on teardown paths.
      }
    },

    isConnected() {
      return connected;
    },

    subscribe(listener: HubMessageListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async invoke(call: ServerFunctionCall): Promise<unknown> {
      if (!connected) {
        await transport.connect();
      }

      const activeSocket = socket;
      if (!activeSocket) {
        throw new Error("WebSocket hub is not connected.");
      }

      const requestId = `ws-${++nextRequestId}`;

      Debug.emit("hub:sync:start", {
        transport: "websockets",
        url,
        call: call.id
      });

      try {
        const invocation = await new Promise<{ result: unknown; invalidated: string[] }>((resolve, reject) => {
          const timeoutHandle = setTimeout(() => {
            pendingInvocations.delete(requestId);
            reject(new Error(`WebSocket invocation timed out after ${requestTimeoutMs}ms.`));
          }, requestTimeoutMs);

          pendingInvocations.set(requestId, {
            callId: call.id,
            timeoutHandle,
            resolve,
            reject
          });

          try {
            activeSocket.send(
              JSON.stringify({
                type: "invoke",
                requestId,
                call
              })
            );
          } catch (error) {
            clearTimeout(timeoutHandle);
            pendingInvocations.delete(requestId);
            reject(new Error(getErrorMessage(error, "Failed to send WebSocket invocation payload.")));
          }
        });

        Debug.emit("hub:sync:complete", {
          transport: "websockets",
          url,
          call: call.id,
          invalidated: invocation.invalidated.length
        });

        return invocation.result;
      } catch (error) {
        Debug.emit("hub:error", {
          transport: "websockets",
          url,
          call: call.id,
          message: getErrorMessage(error, "WebSocket invoke failed")
        });
        throw error;
      }
    }
  };

  if (options.autoConnect !== false) {
    await transport.connect();
  }

  return transport;
}