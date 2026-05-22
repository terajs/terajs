import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRForNode, IRInterpolationNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createAndroidCommandBridge,
  createAndroidCommandConsumer,
  type AndroidBridgeElementNode,
  type AndroidNativeTextNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android consumer", () => {
  it("replays Android bridge commands into a package-local native view tree", async () => {
    const consumer = createAndroidCommandConsumer();
    const bridge = createAndroidCommandBridge({
      emitCommand(command) {
        consumer.applyCommand(command);
      }
    });
    const renderer = createHostIRRenderer({
      host: bridge.host,
      bindings: createHostBindings(bridge.host)
    });

    const label = signal("Alpha");
    const onPress = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "button-view",
      props: [
        {
          kind: "bind",
          name: "contentDescription",
          value: "label",
          binding: {
            kind: "simple-path",
            segments: ["label"]
          }
        },
        {
          kind: "event",
          name: "press",
          value: "onPress"
        }
      ],
      children: [
        {
          type: "interp",
          expression: "label",
          loc: undefined,
          flags: { dynamic: true }
        } as IRInterpolationNode
      ],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = renderer.renderIRNode(node, { label, onPress }) as AndroidBridgeElementNode;
    bridge.host.insert(bridge.root, rendered);

    const root = consumer.root as AndroidNativeViewNode;
    const button = root.children[0] as AndroidNativeViewNode;
    const text = button.children[0] as AndroidNativeTextNode;

    expect(root.viewType).toBe("ViewGroup");
    expect(button.viewType).toBe("Button");
    expect(button.props.contentDescription).toBe("Alpha");
    expect(button.subscribedEvents).toEqual(["press"]);
    expect(text.value).toBe("Alpha");

    label.set("Beta");
    await Promise.resolve();

    expect(button.props.contentDescription).toBe("Beta");
    expect(text.value).toBe("Beta");
  });

  it("replays keyed Android row reuse into the native view tree", async () => {
    const consumer = createAndroidCommandConsumer();
    const bridge = createAndroidCommandBridge({
      emitCommand(command) {
        consumer.applyCommand(command);
      }
    });
    const renderer = createHostIRRenderer({
      host: bridge.host,
      bindings: createHostBindings(bridge.host)
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

    const rendered = renderer.renderIRNode(node, { items });
    bridge.host.insert(bridge.root, rendered!);

    const root = consumer.root as AndroidNativeViewNode;
    const firstRow = root.children[0] as AndroidNativeViewNode;
    const secondRow = root.children[1] as AndroidNativeViewNode;

    expect((firstRow.children[0] as AndroidNativeTextNode).value).toBe("A");
    expect((secondRow.children[0] as AndroidNativeTextNode).value).toBe("B");

    items.set([
      { id: "b", label: "B2" },
      { id: "a", label: "A" }
    ]);
    await Promise.resolve();

    const reorderedFirstRow = root.children[0] as AndroidNativeViewNode;
    const reorderedSecondRow = root.children[1] as AndroidNativeViewNode;
    expect(reorderedFirstRow.id).toBe(secondRow.id);
    expect(reorderedSecondRow.id).toBe(firstRow.id);
    expect((reorderedFirstRow.children[0] as AndroidNativeTextNode).value).toBe("B2");
    expect((reorderedSecondRow.children[0] as AndroidNativeTextNode).value).toBe("A");
  });
});