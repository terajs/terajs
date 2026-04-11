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

interface SignalRHubConnectionLike {
  start(): Promise<void>;
  stop(): Promise<void>;
  invoke(method: string, ...args: unknown[]): Promise<unknown>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  onclose(listener: (error?: unknown) => void): void;
}

interface SignalRHubConnectionBuilderLike {
  withUrl(url: string): SignalRHubConnectionBuilderLike;
  withAutomaticReconnect?(retryDelays?: number[]): SignalRHubConnectionBuilderLike;
  build(): SignalRHubConnectionLike;
}

export interface SignalRModuleLike {
  HubConnectionBuilder: new () => SignalRHubConnectionBuilderLike;
}

export interface SignalRHubTransportOptions {
  url: string;
  autoConnect?: boolean;
  retryPolicy?: HubRetryPolicy;
  invokeMethod?: string;
  invalidationEvent?: string;
  signalR?: SignalRModuleLike;
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

  const response = payload as {
    ok?: boolean;
    result?: unknown;
    invalidated?: unknown;
    error?: { message?: unknown };
  };

  if (response.ok === false) {
    const message = typeof response.error?.message === "string"
      ? response.error.message
      : "SignalR server function invocation failed.";
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

function getDisconnectReason(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "connection closed";
}

function resolveRetryDelays(policy: HubRetryPolicy): number[] {
  if (policy === "none") {
    return [];
  }

  return [0, 1000, 2000, 5000, 10000];
}

async function loadSignalRModule(): Promise<SignalRModuleLike> {
  const dynamicImport = new Function("specifier", "return import(specifier);") as (
    specifier: string
  ) => Promise<unknown>;

  try {
    const module = await dynamicImport("@microsoft/signalr");
    if (module && typeof module === "object" && "HubConnectionBuilder" in module) {
      return module as SignalRModuleLike;
    }

    throw new Error("SignalR module is missing HubConnectionBuilder.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SignalR module load error.";
    throw new Error(
      `Failed to load @microsoft/signalr (${message}). Install it in your app to use sync.hub type \"signalr\".`
    );
  }
}

export async function createSignalRHubTransport(
  options: SignalRHubTransportOptions
): Promise<HubTransport> {
  const url = options.url.trim();
  if (!url) {
    throw new Error("SignalR hub transport requires a non-empty url.");
  }

  const retryPolicy = options.retryPolicy ?? "exponential";
  const invokeMethod = options.invokeMethod ?? "InvokeServerFunction";
  const invalidationEvent = options.invalidationEvent ?? "terajs:invalidate";
  const signalR = options.signalR ?? await loadSignalRModule();
  const builder = new signalR.HubConnectionBuilder().withUrl(url);

  if (retryPolicy === "exponential" && typeof builder.withAutomaticReconnect === "function") {
    builder.withAutomaticReconnect(resolveRetryDelays(retryPolicy));
  }

  const connection = builder.build();
  const listeners = new Set<HubMessageListener>();
  let connected = false;

  connection.onclose((error) => {
    connected = false;
    Debug.emit("hub:disconnect", {
      transport: "signalr",
      url,
      reason: getDisconnectReason(error)
    });
  });

  connection.on(invalidationEvent, (payload: unknown) => {
    const keys = normalizeInvalidationKeys(payload);
    if (keys.length === 0) {
      return;
    }

    Debug.emit("hub:push:received", {
      transport: "signalr",
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
      if (connected) {
        return;
      }

      try {
        await connection.start();
        connected = true;
        Debug.emit("hub:connect", {
          transport: "signalr",
          url,
          retryPolicy
        });
      } catch (error) {
        Debug.emit("hub:error", {
          transport: "signalr",
          url,
          message: error instanceof Error ? error.message : "Failed to connect signalr hub."
        });
        throw error;
      }
    },
    async disconnect() {
      if (!connected) {
        return;
      }

      await connection.stop();
      connected = false;
      Debug.emit("hub:disconnect", {
        transport: "signalr",
        url,
        reason: "manual"
      });
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

      Debug.emit("hub:sync:start", {
        transport: "signalr",
        url,
        call: call.id
      });

      try {
        const rawResponse = await connection.invoke(invokeMethod, call);
        const normalized = normalizeInvocationResult(rawResponse);

        if (normalized.invalidated.length > 0) {
          await invalidateResources(normalized.invalidated);
        }

        Debug.emit("hub:sync:complete", {
          transport: "signalr",
          url,
          call: call.id,
          invalidated: normalized.invalidated.length
        });

        return normalized.result;
      } catch (error) {
        Debug.emit("hub:error", {
          transport: "signalr",
          url,
          call: call.id,
          message: error instanceof Error ? error.message : "SignalR invoke failed"
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
