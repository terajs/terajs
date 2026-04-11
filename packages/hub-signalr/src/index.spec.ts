import { afterEach, describe, expect, it, vi } from "vitest";
import { registerResourceInvalidation } from "@terajs/runtime";
import { Debug } from "@terajs/shared";
import { createSignalRHubTransport, type SignalRModuleLike } from "./index";

function createSignalRTestHarness(invokeResult: unknown = { ok: true, result: "ok" }) {
  const eventHandlers = new Map<string, Array<(...args: unknown[]) => void>>();
  let closeHandler: ((error?: unknown) => void) | undefined;

  const connection = {
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    invoke: vi.fn(async () => invokeResult),
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      const handlers = eventHandlers.get(event) ?? [];
      handlers.push(listener);
      eventHandlers.set(event, handlers);
    }),
    onclose: vi.fn((listener: (error?: unknown) => void) => {
      closeHandler = listener;
    })
  };

  const withUrl = vi.fn((_url: string) => builderApi);
  const withAutomaticReconnect = vi.fn((_retryDelays?: number[]) => builderApi);
  const build = vi.fn(() => connection);

  const builderApi = {
    withUrl,
    withAutomaticReconnect,
    build
  };

  class FakeHubConnectionBuilder {
    withUrl(url: string) {
      withUrl(url);
      return this;
    }

    withAutomaticReconnect(retryDelays?: number[]) {
      withAutomaticReconnect(retryDelays);
      return this;
    }

    build() {
      return build();
    }
  }

  const module: SignalRModuleLike = {
    HubConnectionBuilder: FakeHubConnectionBuilder
  };

  return {
    module,
    connection,
    withUrl,
    withAutomaticReconnect,
    emit(event: string, payload: unknown) {
      const handlers = eventHandlers.get(event) ?? [];
      for (const handler of handlers) {
        handler(payload);
      }
    },
    close(error?: unknown) {
      closeHandler?.(error);
    }
  };
}

describe("createSignalRHubTransport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects immediately by default and emits hub:connect", async () => {
    const harness = createSignalRTestHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    const transport = await createSignalRHubTransport({
      url: "https://api.example.com/chat-hub",
      signalR: harness.module
    });

    expect(harness.withUrl).toHaveBeenCalledWith("https://api.example.com/chat-hub");
    expect(harness.connection.start).toHaveBeenCalledTimes(1);
    expect(transport.isConnected()).toBe(true);
    expect(debugSpy).toHaveBeenCalledWith(
      "hub:connect",
      expect.objectContaining({ transport: "signalr" })
    );
  });

  it("invokes server calls and applies invalidation keys from invocation response", async () => {
    const harness = createSignalRTestHarness({
      ok: true,
      result: "saved",
      invalidated: ["chat:messages"]
    });

    const invalidationSpy = vi.fn(async () => undefined);
    const cleanup = registerResourceInvalidation("chat:messages", invalidationSpy);

    try {
      const transport = await createSignalRHubTransport({
        url: "https://api.example.com/chat-hub",
        signalR: harness.module
      });

      const result = await transport.invoke({
        id: "saveMessage",
        args: ["hello"]
      });

      expect(result).toBe("saved");
      expect(harness.connection.invoke).toHaveBeenCalledWith("InvokeServerFunction", {
        id: "saveMessage",
        args: ["hello"]
      });
      expect(invalidationSpy).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });

  it("publishes invalidation push events to subscribers", async () => {
    const harness = createSignalRTestHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    const transport = await createSignalRHubTransport({
      url: "https://api.example.com/chat-hub",
      autoConnect: false,
      signalR: harness.module
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
    const harness = createSignalRTestHarness();

    await expect(
      createSignalRHubTransport({
        url: "",
        signalR: harness.module
      })
    ).rejects.toThrow("SignalR hub transport requires a non-empty url.");
  });

  it("emits hub:disconnect when connection closes", async () => {
    const harness = createSignalRTestHarness();
    const debugSpy = vi.spyOn(Debug, "emit");

    await createSignalRHubTransport({
      url: "https://api.example.com/chat-hub",
      signalR: harness.module
    });

    harness.close(new Error("network"));

    expect(debugSpy).toHaveBeenCalledWith(
      "hub:disconnect",
      expect.objectContaining({ reason: "network" })
    );
  });
});
