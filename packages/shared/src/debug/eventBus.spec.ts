import { afterEach, describe, expect, it, vi } from "vitest";

async function importEventBus() {
  return import("./eventBus.js");
}

async function importHistory() {
  return import("./history.js");
}

describe("shared debug store", () => {
  afterEach(async () => {
    const history = await importHistory();
    const eventBus = await importEventBus();
    history.clearDebugHistory();
    eventBus.resetDebugListeners();
    vi.resetModules();
  });

  it("shares persisted debug history across fresh module instances", async () => {
    vi.resetModules();
    const historyA = await importHistory();
    const eventBusA = await importEventBus();

    historyA.clearDebugHistory();
    eventBusA.emitDebug({
      type: "component:mounted",
      timestamp: 123,
      scope: "HomePage",
      instance: 1
    } as any);

    vi.resetModules();
    const historyB = await importHistory();

    expect(historyB.readDebugHistory()).toEqual([
      {
        type: "component:mounted",
        timestamp: 123,
        payload: {
          scope: "HomePage",
          instance: 1
        },
        level: undefined,
        file: undefined,
        line: undefined,
        column: undefined
      }
    ]);
  });

  it("shares debug listeners across fresh module instances", async () => {
    vi.resetModules();
    const eventBusA = await importEventBus();
    const seen: Array<{ type: string; scope?: string; instance?: number }> = [];

    eventBusA.resetDebugListeners();
    eventBusA.subscribeDebug((event) => {
      const liveEvent = event as unknown as {
        scope?: unknown;
        instance?: unknown;
        payload?: Record<string, unknown>;
      };
      const payload = liveEvent.payload;
      seen.push({
        type: event.type,
        scope: typeof liveEvent.scope === "string"
          ? liveEvent.scope
          : typeof payload?.scope === "string"
            ? payload.scope
            : undefined,
        instance: typeof liveEvent.instance === "number"
          ? liveEvent.instance
          : typeof payload?.instance === "number"
            ? payload.instance
            : undefined
      });
    });

    vi.resetModules();
    const eventBusB = await importEventBus();
    eventBusB.emitDebug({
      type: "component:mounted",
      timestamp: 456,
      scope: "SiteHeader",
      instance: 2
    });

    expect(seen).toEqual([
      {
        type: "component:mounted",
        scope: "SiteHeader",
        instance: 2
      }
    ]);
  });

  it("does not invoke accessors while retaining debug payloads", async () => {
    const history = await importHistory();
    const eventBus = await importEventBus();
    let reads = 0;
    const payload = Object.defineProperty({}, "state", {
      enumerable: true,
      get() {
        reads += 1;
        return { ready: true };
      }
    });

    eventBus.emitDebug({
      type: "component:props:update",
      timestamp: Date.now(),
      payload
    } as any);

    expect(reads).toBe(0);
    expect(history.readDebugHistory().at(-1)?.payload).toEqual({
      state: "[accessor]"
    });
  });

  it("delivers transient events live without retaining them for replay", async () => {
    const history = await importHistory();
    const eventBus = await importEventBus();
    const seen: string[] = [];
    const unsubscribe = eventBus.subscribeDebug((event) => {
      seen.push(event.type);
    });

    eventBus.emitDebug({
      type: "reactive:read",
      timestamp: Date.now(),
      rid: "ReviewCard#1.selected"
    });
    unsubscribe();

    expect(seen).toEqual(["reactive:read"]);
    expect(history.readDebugHistory()).toEqual([]);
  });
});
