import { describe, expect, it } from "vitest";

import type { IRElementNode, IRInterpolationNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createSimulationHost,
  nextSimulationTick,
  simulationTextContent,
  type SimulationElementNode,
} from "../../renderer-web/src/testing/simulationHost.js";

describe("renderer-ios simulation host", () => {
  it("renders compiler output against a UIKit-style host simulation", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const title = signal("Alpha");
    const node: IRElementNode = {
      type: "element",
      tag: "ui-label",
      props: [
        {
          kind: "bind",
          name: "accessibilityLabel",
          value: "title",
          binding: {
            kind: "simple-path",
            segments: ["title"]
          }
        }
      ],
      children: [
        {
          type: "interp",
          expression: "title",
          loc: undefined,
          flags: { dynamic: true }
        } as IRInterpolationNode
      ],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const root = host.createElement("UIView");
    const rendered = renderer.renderIRNode(node, { title }) as SimulationElementNode;
    host.insert(root, rendered);

    expect(rendered.tag).toBe("ui-label");
    expect(rendered.props.accessibilityLabel).toBe("Alpha");
    expect(simulationTextContent(root)).toBe("Alpha");

    title.set("Beta");
    await nextSimulationTick();

    expect(rendered.props.accessibilityLabel).toBe("Beta");
    expect(simulationTextContent(root)).toBe("Beta");
  });
});