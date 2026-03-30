import { describe, it, expect, vi } from "vitest";
import { scheduleHydration } from "../../src/hydration/hydration";

describe("scheduleHydration", () => {
  it("eager hydrates immediately", () => {
    const mount = vi.fn();
    scheduleHydration("eager", mount, document.createElement("div"));
    expect(mount).toHaveBeenCalled();
  });

  it("none never hydrates", () => {
    const mount = vi.fn();
    scheduleHydration("none", mount, document.createElement("div"));
    expect(mount).not.toHaveBeenCalled();
  });

  it("idle hydrates on idle", async () => {
    const mount = vi.fn();
    globalThis.requestIdleCallback = (cb: any) => cb();

    scheduleHydration("idle", mount, document.createElement("div"));
    expect(mount).toHaveBeenCalled();
  });

  it("interaction hydrates on click", () => {
    const el = document.createElement("div");
    const mount = vi.fn();

    scheduleHydration("interaction", mount, el);
    el.dispatchEvent(new Event("click"));

    expect(mount).toHaveBeenCalled();
  });
});
