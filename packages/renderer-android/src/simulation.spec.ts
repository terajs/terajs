import { describe, expect, it } from "vitest";

import type { IRElementNode, IRForNode, IRInterpolationNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createSimulationHost,
  nextSimulationTick,
  simulationElementChildren,
  simulationTextContent,
  type SimulationNode,
} from "../../renderer-web/src/testing/simulationHost.js";

describe("renderer-android simulation host", () => {
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