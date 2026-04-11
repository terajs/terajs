import { describe, it, expect, vi } from "vitest";
import { Debug } from "@terajs/shared";
import {
  applyHMRUpdate,
  registerHMRComponent
} from "./hmr";

vi.mock("@terajs/shared", () => ({
  Debug: { emit: vi.fn() }
}));

describe("HMR Runtime (integration)", () => {
  it("emits correct update events in order", () => {
    // A valid ComponentContext mock
    const fakeCtx = {
      instance: 1,
      props: {},
      frame: {},
      name: "Test",
      disposers: [] // <-- FIXED: must be an array, not a Set
    };

    // A valid HMRInstance mock
    const fakeInstance = {
      ctx: fakeCtx,
      dispose: vi.fn(),
      remount: vi.fn(),
      updateIR: vi.fn()
    };

    // A valid HMRComponentHandle mock
    const handle = {
      name: "Test",
      getSetup: () => () => ({ msg: "old" }),
      getIR: () => ({ template: [] }),
      setSetup: vi.fn(),
      setIR: vi.fn(),
      instances: new Set([fakeInstance])
    };

    // Register component
    registerHMRComponent(handle);

    // Apply update
    applyHMRUpdate(
      "Test",
      () => ({ msg: "new" }),
      { template: ["updated"] }
    );

    // Assertions
    expect(Debug.emit).toHaveBeenCalledWith("hmr:register", {
      name: "Test"
    });

    expect(Debug.emit).toHaveBeenCalledWith("hmr:update:component", {
      name: "Test",
      start: true
    });

    expect(Debug.emit).toHaveBeenCalledWith("hmr:update:setup", {
      name: "Test"
    });

    expect(Debug.emit).toHaveBeenCalledWith("hmr:update:ir", {
      name: "Test"
    });

    expect(Debug.emit).toHaveBeenCalledWith("hmr:update:instance", {
      name: "Test",
      instance: 1
    });

    expect(Debug.emit).toHaveBeenCalledWith("hmr:update:component", {
      name: "Test",
      complete: true
    });
  });
});

