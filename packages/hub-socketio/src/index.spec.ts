import { afterEach, describe, expect, it, vi } from "vitest";
import { registerResourceInvalidation } from "@terajs/runtime";
import { Debug } from "@terajs/shared";
import { createSocketIoHubTransport, type SocketIoHubTransportOptions } from "./index";

function createSocketIOHarness(invokeResult: unknown = { ok: true, result: "ok" }) {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  let connected = false;

  function dispatch(event: string, ...args: unknown[]) {
    const handlers = listeners.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(...args);
    }
  }

  const socket = {
    get connected() {
      return connected;
    },
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      const handlers = listeners.get(event) ?? new Set<(...args: unknown[]) => void>();
      handlers.add(listener);
      listeners.set(event, handlers);
    }),
    off: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      const handlers = listeners.get(event);
      handlers?.delete(listener);
    }),
    connect: vi.fn(() => {
      connected = true;
      dispatch("connect");
    }),
    disconnect: vi.fn(() => {
      connected = false;
      dispatch("disconnect", "io client disconnect");
    }),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      if (event === "terajs:invoke") {
        const ack = args[1] as ((payload: unknown) => void) | undefined;
        ack?.(invokeResult);
        return;
      }

      dispatch(event, ...args);
    })
  };

  const module = {
    io: vi.fn(() => socket)
  };

  return {
    socket,
    module,
    emit(event: string, payload: unknown) {
      dispatch(event, payload);
    },
    disconnect(reason = "network") {
      connected = false;
      dispatch("disconnect", reason);
    }
  };
}

describe("createSocketIoHubTransport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects immediately by default and emits hub:connect", async () => {
    const harness = createSocketIOHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    const transport = await createSocketIoHubTransport({
      url: "https://api.example.com/chat-hub",
      socketIO: harness.module
    } satisfies SocketIoHubTransportOptions);

    expect(harness.module.io).toHaveBeenCalledWith(
      "https://api.example.com/chat-hub",
      expect.objectContaining({ autoConnect: false })
    );
    expect(harness.socket.connect).toHaveBeenCalledTimes(1);
    expect(transport.isConnected()).toBe(true);
    expect(debugSpy).toHaveBeenCalledWith(
      "hub:connect",
      expect.objectContaining({ transport: "socket.io" })
    );
  });

  it("invokes server calls and applies invalidation keys from invocation response", async () => {
    const harness = createSocketIOHarness({
      ok: true,
      result: "saved",
      invalidated: ["chat:messages"]
    });

    const invalidationSpy = vi.fn(async () => undefined);
    const cleanup = registerResourceInvalidation("chat:messages", invalidationSpy);

    try {
      const transport = await createSocketIoHubTransport({
        url: "https://api.example.com/chat-hub",
        socketIO: harness.module
      });

      const result = await transport.invoke({
        id: "saveMessage",
        args: ["hello"]
      });

      expect(result).toBe("saved");
      expect(harness.socket.emit).toHaveBeenCalledWith(
        "terajs:invoke",
        { id: "saveMessage", args: ["hello"] },
        expect.any(Function)
      );
      expect(invalidationSpy).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });

  it("publishes invalidation push events to subscribers", async () => {
    const harness = createSocketIOHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    const transport = await createSocketIoHubTransport({
      url: "https://api.example.com/chat-hub",
      autoConnect: false,
      socketIO: harness.module
    });

    const listener = vi.fn();
    const unsubscribe = transport.subscribe(listener);

    harness.emit("terajs:invalidate", { keys: ["chat:messages"] });

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
    const harness = createSocketIOHarness();

    await expect(
      createSocketIoHubTransport({
        url: "",
        socketIO: harness.module
      })
    ).rejects.toThrow("Socket.IO hub transport requires a non-empty url.");
  });

  it("emits hub:disconnect when connection closes", async () => {
    const harness = createSocketIOHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    await createSocketIoHubTransport({
      url: "https://api.example.com/chat-hub",
      socketIO: harness.module
    });

    harness.disconnect("network");

    expect(debugSpy).toHaveBeenCalledWith(
      "hub:disconnect",
      expect.objectContaining({ reason: "network" })
    );
  });
});