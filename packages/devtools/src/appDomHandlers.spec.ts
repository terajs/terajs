import { describe, expect, it, vi } from "vitest";
import { createInputHandler } from "./appDomHandlers.js";

describe("createInputHandler", () => {
  it("updates the timeline cursor from input-like targets", () => {
    const state = {
      componentSearchQuery: "",
      componentInspectorQuery: "",
      timelineCursor: 12,
    };
    const render = vi.fn();
    const handler = createInputHandler(state, render);

    const target = {
      tagName: "INPUT",
      value: "3",
      dataset: {
        timelineCursor: "true",
      },
    } as unknown as HTMLInputElement;

    handler({ target } as unknown as Event);

    expect(state.timelineCursor).toBe(3);
    expect(render).toHaveBeenCalledTimes(1);
  });
});