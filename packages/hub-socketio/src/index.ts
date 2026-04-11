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

interface SocketLike {
  connected: boolean;
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: unknown[]) => void): void;
  connect(): void;
  disconnect(): void;
  emit(event: string, ...args: unknown[]): void;
}

interface SocketIOModuleLike {
  io(url: string, options?: Record<string, unknown>): SocketLike;
}

interface InvocationResultPayload {
  ok?: boolean;
  result?: unknown;
  invalidated?: unknown;
  error?: {
    message?: unknown;
  } | string;
}

export interface SocketIoHubTransportOptions {
  url: string;
  autoConnect?: boolean;
  retryPolicy?: HubRetryPolicy;
  invokeEvent?: string;
  invalidationEvent?: string;
  ackTimeoutMs?: number;
  socketIO?: SocketIOModuleLike;
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

function normalizeInvocationResult(payload: unknown): {
  result: unknown;
  invalidated: string[];
} {
  if (!payload || typeof payload !== "object") {
    return {
      result: payload,
      invalidated: []
    };
  }

  const response = payload as InvocationResultPayload;
  if (response.ok === false) {
    const message = typeof response.error === "string"
      ? response.error
      : typeof response.error?.message === "string"
      ? response.error.message
      : "Socket.IO server function invocation failed.";
    throw new Error(message);
  }

  const invalidated = normalizeInvalidationKeys(response.invalidated);
  if (response.ok === true || "result" in response) {
    return {
      result: response.result,
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

function normalizeDisconnectReason(reason: unknown): string {
  if (typeof reason === "string" && reason.trim().length > 0) {
    if (reason === "io client disconnect") {
      return "manual";
    }

    return reason;
  }

  return "connection closed";
}

async function loadSocketIOModule(): Promise<SocketIOModuleLike> {
  const dynamicImport = new Function("specifier", "return import(specifier);") as (
    specifier: string
  ) => Promise<unknown>;

  try {
    const module = await dynamicImport("socket.io-client");
    if (module && typeof module === "object") {
      const namedIo = (module as Record<string, unknown>).io;
      if (typeof namedIo === "function") {
        return {
          io: namedIo as SocketIOModuleLike["io"]
        };
      }

      const defaultExport = (module as Record<string, unknown>).default;
      if (typeof defaultExport === "function") {
        return {
          io: defaultExport as SocketIOModuleLike["io"]
        };
      }

      if (defaultExport && typeof defaultExport === "object") {
        const defaultIo = (defaultExport as Record<string, unknown>).io;
        if (typeof defaultIo === "function") {
          return {
            io: defaultIo as SocketIOModuleLike["io"]
          };
        }
      }
    }

    throw new Error("socket.io-client module is missing an io factory.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown socket.io-client module load error.";
    throw new Error(
      `Failed to load socket.io-client (${message}). Install it in your app to use sync.hub type \"socket.io\".`
    );
  }
}

export async function createSocketIoHubTransport(
  options: SocketIoHubTransportOptions
): Promise<HubTransport> {
  const url = options.url.trim();
  if (!url) {
    throw new Error("Socket.IO hub transport requires a non-empty url.");
  }

  const retryPolicy = options.retryPolicy ?? "exponential";
  const invokeEvent = options.invokeEvent ?? "terajs:invoke";
  const invalidationEvent = options.invalidationEvent ?? "terajs:invalidate";
  const ackTimeoutMs = typeof options.ackTimeoutMs === "number" && Number.isFinite(options.ackTimeoutMs)
    ? Math.min(120000, Math.max(1000, Math.round(options.ackTimeoutMs)))
    : 15000;
  const socketIO = options.socketIO ?? await loadSocketIOModule();

  const socket = socketIO.io(url, {
    autoConnect: false,
    reconnection: retryPolicy === "exponential",
    reconnectionAttempts: retryPolicy === "none" ? 0 : Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000
  });

  const listeners = new Set<HubMessageListener>();
  let connected = Boolean(socket.connected);
  let connectPromise: Promise<void> | null = null;
  let manualDisconnect = false;

  socket.on("disconnect", (reason: unknown) => {
    const normalizedReason = manualDisconnect ? "manual" : normalizeDisconnectReason(reason);
    connected = false;

    if (manualDisconnect && normalizedReason === "manual") {
      manualDisconnect = false;
      return;
    }

    Debug.emit("hub:disconnect", {
      transport: "socket.io",
      url,
      reason: normalizedReason
    });
  });

  socket.on("connect_error", (error: unknown) => {
    Debug.emit("hub:error", {
      transport: "socket.io",
      url,
      message: getErrorMessage(error, "Socket.IO connection error")
    });
  });

  socket.on(invalidationEvent, (payload: unknown) => {
    const keys = normalizeInvalidationKeys(payload);
    if (keys.length === 0) {
      return;
    }

    Debug.emit("hub:push:received", {
      transport: "socket.io",
      url,
      type: "invalidate",
      keys
    });

    for (const listener of listeners) {
      listener({
        type: "invalidate",
        keys
      });
    }
  });

  const transport: HubTransport = {
    async connect() {
      if (connected || socket.connected) {
        connected = true;
        return;
      }

      if (connectPromise) {
        return connectPromise;
      }

      manualDisconnect = false;

      connectPromise = new Promise<void>((resolve, reject) => {
        const onConnect = () => {
          socket.off("connect", onConnect);
          socket.off("connect_error", onConnectError);
          connected = true;
          Debug.emit("hub:connect", {
            transport: "socket.io",
            url,
            retryPolicy
          });
          resolve();
        };

        const onConnectError = (error: unknown) => {
          socket.off("connect", onConnect);
          socket.off("connect_error", onConnectError);
          reject(new Error(getErrorMessage(error, "Socket.IO connection failed.")));
        };

        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.connect();
      }).finally(() => {
        connectPromise = null;
      });

      return connectPromise;
    },

    async disconnect() {
      if (!connected && !socket.connected) {
        return;
      }

      manualDisconnect = true;
      connected = false;

      Debug.emit("hub:disconnect", {
        transport: "socket.io",
        url,
        reason: "manual"
      });

      socket.disconnect();
    },

    isConnected() {
      return connected || socket.connected;
    },

    subscribe(listener: HubMessageListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async invoke(call: ServerFunctionCall): Promise<unknown> {
      if (!transport.isConnected()) {
        await transport.connect();
      }

      Debug.emit("hub:sync:start", {
        transport: "socket.io",
        url,
        call: call.id
      });

      try {
        const invocation = await new Promise<{ result: unknown; invalidated: string[] }>((resolve, reject) => {
          const timeoutHandle = setTimeout(() => {
            reject(new Error(`Socket.IO invocation timed out after ${ackTimeoutMs}ms.`));
          }, ackTimeoutMs);

          const ack = async (payload: unknown) => {
            clearTimeout(timeoutHandle);

            try {
              const normalized = normalizeInvocationResult(payload);
              if (normalized.invalidated.length > 0) {
                await invalidateResources(normalized.invalidated);
              }

              resolve(normalized);
            } catch (error) {
              reject(new Error(getErrorMessage(error, "Socket.IO invocation failed.")));
            }
          };

          try {
            socket.emit(invokeEvent, call, ack);
          } catch (error) {
            clearTimeout(timeoutHandle);
            reject(new Error(getErrorMessage(error, "Failed to emit Socket.IO invocation.")));
          }
        });

        Debug.emit("hub:sync:complete", {
          transport: "socket.io",
          url,
          call: call.id,
          invalidated: invocation.invalidated.length
        });

        return invocation.result;
      } catch (error) {
        Debug.emit("hub:error", {
          transport: "socket.io",
          url,
          call: call.id,
          message: getErrorMessage(error, "Socket.IO invoke failed")
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