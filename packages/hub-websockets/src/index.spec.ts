import { afterEach, describe, expect, it, vi } from "vitest";
import { registerResourceInvalidation } from "@terajs/runtime";
import { Debug } from "@terajs/shared";
import { createWebSocketHubTransport } from "./index";

class FakeWebSocket {
  public readonly url: string;
  public readyState = 0;
  public sent: string[] = [];
  private listeners = new Map<string, Set<(event: unknown) => void>>();

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(event: string, listener: (event: unknown) => void): void {
    const handlers = this.listeners.get(event) ?? new Set<(event: unknown) => void>();
    handlers.add(listener);
    this.listeners.set(event, handlers);
  }

  removeEventListener(event: string, listener: (event: unknown) => void): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    handlers.delete(listener);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.emit("close", { reason: "manual" });
  }

  emit(event: string, payload: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }
}

function createWebSocketHarness() {
  const sockets: FakeWebSocket[] = [];

  return {
    sockets,
    factory(url: string) {
      const socket = new FakeWebSocket(url);
      sockets.push(socket);
      queueMicrotask(() => {
        socket.readyState = 1;
        socket.emit("open", {});
      });
      return socket;
    }
  };
}

describe("createWebSocketHubTransport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects immediately by default and emits hub:connect", async () => {
    const harness = createWebSocketHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    const transport = await createWebSocketHubTransport({
      url: "wss://api.example.com/chat-hub",
      createWebSocket: harness.factory
    });

    expect(harness.sockets).toHaveLength(1);
    expect(transport.isConnected()).toBe(true);
    expect(debugSpy).toHaveBeenCalledWith(
      "hub:connect",
      expect.objectContaining({ transport: "websockets" })
    );
  });

  it("invokes server calls and applies invalidation keys from invocation response", async () => {
    const harness = createWebSocketHarness();
    const invalidationSpy = vi.fn(async () => undefined);
    const cleanup = registerResourceInvalidation("chat:messages", invalidationSpy);

    try {
      const transport = await createWebSocketHubTransport({
        url: "wss://api.example.com/chat-hub",
        createWebSocket: harness.factory
      });

      const socket = harness.sockets[0];
      const invokePromise = transport.invoke({
        id: "saveMessage",
        args: ["hello"]
      });

      const invocation = JSON.parse(socket.sent[0]) as {
        requestId: string;
      };

      socket.emit("message", {
        data: JSON.stringify({
          type: "response",
          requestId: invocation.requestId,
          ok: true,
          result: "saved",
          invalidated: ["chat:messages"]
        })
      });

      await expect(invokePromise).resolves.toBe("saved");
      expect(invalidationSpy).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });

  it("publishes invalidation push events to subscribers", async () => {
    const harness = createWebSocketHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    const transport = await createWebSocketHubTransport({
      url: "wss://api.example.com/chat-hub",
      createWebSocket: harness.factory
    });

    const listener = vi.fn();
    const unsubscribe = transport.subscribe(listener);

    harness.sockets[0].emit("message", {
      data: JSON.stringify({
        type: "invalidate",
        keys: ["chat:messages"]
      })
    });

    expect(listener).toHaveBeenCalledWith({
      type: "invalidate",
      keys: ["chat:messages"]
    });
    expect(debugSpy).toHaveBeenCalledWith(
      "hub:push:received",
      expect.objectContaining({ type: "invalidate" })
    );

    unsubscribe();
  });

  it("fails when url is missing", async () => {
    const harness = createWebSocketHarness();

    await expect(
      createWebSocketHubTransport({
        url: "",
        createWebSocket: harness.factory
      })
    ).rejects.toThrow("WebSocket hub transport requires a non-empty url.");
  });

  it("emits hub:disconnect when connection closes", async () => {
    const harness = createWebSocketHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    await createWebSocketHubTransport({
      url: "wss://api.example.com/chat-hub",
      createWebSocket: harness.factory
    });

    harness.sockets[0].emit("close", { reason: "network" });

    expect(debugSpy).toHaveBeenCalledWith(
      "hub:disconnect",
      expect.objectContaining({ reason: "network" })
    );
  });
});