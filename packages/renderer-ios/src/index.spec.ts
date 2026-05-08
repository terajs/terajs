import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRInterpolationNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import { createHostBindings } from "../../renderer-web/src/hostBindings.js";
import { createHostIRRenderer } from "../../renderer-web/src/createHostIRRenderer.js";
import {
  createSimulationHost,
  nextSimulationTick,
  simulationTextContent,
  type SimulationElementNode,
} from "../../renderer-web/src/testing/simulationHost.js";

import { UIKitViewAdapter, renderTerajsToUIKitViews } from "./index.js";

describe("renderer-ios stub", () => {
  it("creates, inserts, updates, and removes UIKit host nodes", () => {
    const root = UIKitViewAdapter.createElement("UIView");
    const child = UIKitViewAdapter.createElement("UILabel");

    UIKitViewAdapter.insert(root, child);
    UIKitViewAdapter.setProp(child, "text", "Hello native");

    expect(root.children).toEqual([child]);
    expect(child.parent).toBe(root);
    expect(child.props.text).toBe("Hello native");

    UIKitViewAdapter.remove(child);

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

    const root = renderTerajsToUIKitViews({ name: "App" }, adapter);

    expect(createElement).toHaveBeenCalledWith("UIView");
    expect(root.type).toBe("UIView");
  });

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