import { describe, expect, it } from "vitest";

import type {
  IRElementNode,
  IRForNode,
  IRIfNode,
  IRInterpolationNode,
  IRSlotNode,
} from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import { createHostBindings } from "./hostBindings.js";
import { createHostIRRenderer } from "./createHostIRRenderer.js";
import {
  createSimulationHost,
  nextSimulationTick,
  simulationElementChildren,
  simulationTextContent,
  type SimulationElementNode,
  type SimulationNode,
  type SimulationTextNode,
} from "./testing/simulationHost.js";

describe("createHostIRRenderer", () => {
  it("renders and updates interpolation against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const label = signal("alpha");
    const node: IRInterpolationNode = {
      type: "interp",
      expression: "label",
      loc: undefined,
      flags: { dynamic: true }
    };

    const rendered = renderer.renderIRNode(node, { label }) as SimulationTextNode;
    expect(rendered.data).toBe("alpha");

    label.set("beta");
    await nextSimulationTick();

    expect(rendered.data).toBe("beta");
  });

  it("renders elements with reactive props and event handlers against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const title = signal("alpha");
    let clicked = false;
    const node: IRElementNode = {
      type: "element",
      tag: "button",
      props: [
        {
          kind: "bind",
          name: "title",
          value: "title",
          binding: {
            kind: "simple-path",
            segments: ["title"]
          }
        },
        {
          kind: "event",
          name: "click",
          value: "onClick"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const rendered = renderer.renderIRNode(node, {
      title,
      onClick: () => {
        clicked = true;
      }
    }) as SimulationElementNode;

    expect(rendered.props.title).toBe("alpha");

    title.set("beta");
    await nextSimulationTick();

    expect(rendered.props.title).toBe("beta");
    rendered.events.click[0]?.();
    expect(clicked).toBe(true);
  });

  it("updates and disposes if-branch effects against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const root = host.createElement("root");
    const show = signal(true);
    const count = signal(1);
    const node: IRIfNode = {
      type: "if",
      condition: "show",
      then: [
        {
          type: "interp",
          expression: "count",
          loc: undefined,
          flags: { dynamic: true }
        } as IRInterpolationNode
      ],
      else: [],
      loc: undefined,
      flags: {}
    };

    const rendered = renderer.renderIRNode(node, { show, count }) as SimulationNode;
    host.insert(root, rendered);

    const removedText = root.children.find(
      (child): child is SimulationTextNode => child.kind === "text"
    ) as SimulationTextNode;
    expect(simulationTextContent(root)).toBe("1");

    show.set(false);
    await nextSimulationTick();
    expect(simulationTextContent(root)).toBe("");

    count.set(2);
    await nextSimulationTick();
    expect(removedText.data).toBe("1");
  });

  it("renders slot content before fallback against a non-DOM host", () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const node: IRSlotNode = {
      type: "slot",
      name: "default",
      fallback: [
        {
          type: "text",
          value: "fallback",
          loc: undefined,
          flags: { dynamic: false }
        }
      ],
      loc: undefined,
      flags: {}
    };

    const rendered = renderer.renderIRNode(node, {
      slots: {
        default: () => ["alpha", false, "beta"]
      }
    }) as SimulationNode;

    expect(simulationTextContent(rendered)).toBe("alphabeta");
  });

  it("renders reactive for nodes against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const items = signal<number[]>([1, 2]);
    const node: IRForNode = {
      type: "for",
      each: "items",
      item: "item",
      index: "i",
      body: [
        {
          type: "element",
          tag: "div",
          props: [],
          children: [
            {
              type: "interp",
              expression: "item",
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

    const root = host.createElement("root");
    const rendered = renderer.renderIRNode(node, { items }) as SimulationNode;
    host.insert(root, rendered);

    expect(simulationTextContent(root)).toBe("12");

    items.set([3, 4, 5]);
    await nextSimulationTick();

    expect(simulationTextContent(root)).toBe("345");
  });

  it("reuses keyed row nodes against a non-DOM host", async () => {
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
          tag: "div",
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

    const root = host.createElement("root");
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
