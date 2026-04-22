import { afterEach, describe, expect, it, vi } from "vitest";

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  vi.resetModules();
});

describe("production instrumentation gating", () => {
  it("skips registry tracking and debug events for core reactive primitives in production", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const reactivity = await import("./index.js");
    const shared = await import("@terajs/shared");
    const debugSpy = vi.spyOn(shared.Debug, "emit");

    shared.resetDebugRegistry();
    shared.resetDebugHandlers();
    shared.resetDebugListeners();

    const count = reactivity.signal(1, { scope: "Counter", instance: 1, key: "count" });
    const boxed = reactivity.ref(2, { scope: "Counter", instance: 1, key: "boxed" });
    const total = reactivity.computed(() => count() + boxed.value, { key: "total" });
    const state = reactivity.reactive({ ready: true }, { scope: "Counter", instance: 1 });

    expect(total.get()).toBe(3);
    expect(state.ready).toBe(true);
    boxed.value = 4;
    count.set(5);
    expect(total.get()).toBe(9);

    expect(reactivity.getActiveSignals()).toEqual([]);
    expect(shared.getAllReactives()).toEqual([]);
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("skips effect metadata and debug lifecycle events in production", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const { effect, signal } = await import("./index.js");
    const shared = await import("@terajs/shared");
    const debugSpy = vi.spyOn(shared.Debug, "emit");
    const count = signal(1, { scope: "Counter", instance: 1, key: "count" });

    let runs = 0;
    const runner = effect(() => {
      runs += 1;
      count();
    });

    count.set(2);

    expect(runs).toBe(2);
    expect((runner as any)._meta.rid).toBe("");
    expect(debugSpy).not.toHaveBeenCalled();
  });
});