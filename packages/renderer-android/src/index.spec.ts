import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRForNode, IRInterpolationNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import { createHostBindings } from "../../renderer-web/src/hostBindings.js";
import { createHostIRRenderer } from "../../renderer-web/src/createHostIRRenderer.js";
import {
  createSimulationHost,
  nextSimulationTick,
  simulationElementChildren,
  simulationTextContent,
  type SimulationNode,
} from "../../renderer-web/src/testing/simulationHost.js";

import { AndroidViewAdapter, renderTerajsToAndroidViews } from "./index.js";

describe("renderer-android stub", () => {
  it("creates, inserts, updates, and removes Android host nodes", () => {
    const root = AndroidViewAdapter.createElement("ViewGroup");
    const child = AndroidViewAdapter.createElement("TextView");

    AndroidViewAdapter.insert(root, child);
    AndroidViewAdapter.setProp(child, "text", "Hello native");

    expect(root.children).toEqual([child]);
    expect(child.parent).toBe(root);
    expect(child.props.text).toBe("Hello native");

    AndroidViewAdapter.remove(child);

    expect(root.children).toEqual([]);
    expect(child.parent).toBeNull();
  });

  it("uses the provided adapter when creating the placeholder root view", () => {
    const createElement = vi.fn((type: string) => ({ type, props: {}, children: [], parent: null }));
    const adapter = {
      createElement,
      insert: vi.fn(),
      remove: vi.fn(),
      setProp: vi.fn()
    };

    const root = renderTerajsToAndroidViews({ name: "App" }, adapter);

    expect(createElement).toHaveBeenCalledWith("ViewGroup");
    expect(root.type).toBe("ViewGroup");
  });

  it("reuses compiler-driven list rows against an Android Views-style host simulation", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const items = signal([
      { id: "a", label: "A" },
      { id: "b", label: "B" }
    ]);
    const node: IRForNode = {
      type: "for",
      each: "items",
      item: "item",
      index: "i",
      body: [
        {
          type: "element",
          tag: "text-view",
          props: [],
          children: [
            {
              type: "interp",
              expression: "item.label",
              loc: undefined,
              flags: { dynamic: true }
            } as IRInterpolationNode
          ],
          loc: undefined,
          flags: { hasDirectives: false }
        } as IRElementNode
      ],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const root = host.createElement("LinearLayout");
    const rendered = renderer.renderIRNode(node, { items }) as SimulationNode;
    host.insert(root, rendered);

    const initialRows = simulationElementChildren(root);
    const firstNode = initialRows[0];
    const secondNode = initialRows[1];

    expect(simulationTextContent(root)).toBe("AB");

    items.set([
      { id: "b", label: "B2" },
      { id: "a", label: "A" }
    ]);
    await nextSimulationTick();

    const reorderedRows = simulationElementChildren(root);
    expect(simulationTextContent(root)).toBe("B2A");
    expect(reorderedRows[0]).toBe(secondNode);
    expect(reorderedRows[1]).toBe(firstNode);
  });
});