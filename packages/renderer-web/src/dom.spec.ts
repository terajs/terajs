import { describe, expect, it, vi } from "vitest";
import { addNodeCleanup, disposeNodeTree, removeNodeCleanup } from "./dom.js";

describe("node cleanup bookkeeping", () => {
  it("runs a single registered cleanup without array promotion", () => {
    const node = document.createTextNode("value");
    const cleanup = vi.fn();

    addNodeCleanup(node, cleanup);
    disposeNodeTree(node);

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("keeps remaining cleanups after removing one from a promoted entry", () => {
    const node = document.createTextNode("value");
    const first = vi.fn();
    const second = vi.fn();

    addNodeCleanup(node, first);
    addNodeCleanup(node, second);
    removeNodeCleanup(node, first);
    disposeNodeTree(node);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});