import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRForNode, IRIfNode, IRInterpolationNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createSimulationHost,
  nextSimulationTick,
  simulationElementChildren,
  simulationTextContent,
  type SimulationNode,
} from "../../renderer-web/src/testing/simulationHost.js";

import {
  createAndroidCommandBridge,
  createAndroidCommandConsumer,
  type AndroidBridgeElementNode,
  type AndroidBridgeTextNode,
  type AndroidNativeTextNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android stub", () => {
  it("records thin Android host commands without sending JS handlers across the bridge", () => {
    const bridge = createAndroidCommandBridge();
    const row = bridge.host.createElement("button");
    const text = bridge.host.createText("Hello native");
    const handler = vi.fn();

    bridge.host.insert(bridge.root, row);
    bridge.host.insert(row, text);
    bridge.host.setProp(row, "aria-label", "Greeting");
    bridge.host.setStyle(row, { color: "#1E88E5" });
    bridge.host.setClass(row, "headline");
    bridge.host.addEvent(row, "click", handler);
    bridge.dispatchEvent(row, "press", { source: "native" });
    bridge.host.removeEvent(row, "click", handler);
    bridge.host.remove(row);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ source: "native" });
    expect(bridge.commands).toEqual([
      {
        type: "create-element",
        nodeId: bridge.root.id,
        viewType: "ViewGroup",
        svg: false
      },
      {
        type: "create-element",
        nodeId: row.id,
        viewType: "Button",
        svg: false
      },
      {
        type: "create-text",
        nodeId: text.id,
        value: "Hello native"
      },
      {
        type: "insert",
        parentId: bridge.root.id,
        childId: row.id,
        anchorId: null
      },
      {
        type: "insert",
        parentId: row.id,
        childId: text.id,
        anchorId: null
      },
      {
        type: "set-prop",
        nodeId: row.id,
        name: "contentDescription",
        value: "Greeting"
      },
      {
        type: "set-style",
        nodeId: row.id,
        style: { color: "#1E88E5" }
      },
      {
        type: "set-class",
        nodeId: row.id,
        className: "headline"
      },
      {
        type: "subscribe-event",
        nodeId: row.id,
        name: "press"
      },
      {
        type: "unsubscribe-event",
        nodeId: row.id,
        name: "press"
      },
      {
        type: "remove",
        nodeId: row.id
      }
    ]);
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

  it("renders compiler output through the Android command bridge", async () => {
    const bridge = createAndroidCommandBridge();
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

    expect(rendered.viewType).toBe("Button");
    expect(rendered.props.contentDescription).toBe("Alpha");
    expect(rendered.children).toHaveLength(1);
    expect((rendered.children[0] as AndroidBridgeTextNode).value).toBe("Alpha");
    expect(bridge.commands.some((command) => command.type === "subscribe-event" && command.nodeId === rendered.id && command.name === "press")).toBe(true);

    bridge.dispatchEvent(rendered, "press", { action: "primary" });
    expect(onPress).toHaveBeenCalledWith({ action: "primary" });

    label.set("Beta");
    await Promise.resolve();

    expect(rendered.props.contentDescription).toBe("Beta");
    expect((rendered.children[0] as AndroidBridgeTextNode).value).toBe("Beta");
  });

  it("keeps control-flow anchors JS-local while updating native-backed Android nodes", async () => {
    const bridge = createAndroidCommandBridge();
    const renderer = createHostIRRenderer({
      host: bridge.host,
      bindings: createHostBindings(bridge.host)
    });

    const visible = signal(true);
    const node: IRIfNode = {
      type: "if",
      condition: "visible",
      then: [
        {
          type: "element",
          tag: "text-view",
          props: [],
          children: [
            {
              type: "text",
              value: "Visible",
              loc: undefined,
              flags: { dynamic: false }
            }
          ],
          loc: undefined,
          flags: { hasDirectives: false }
        } as IRElementNode
      ],
      else: [
        {
          type: "text",
          value: "Hidden",
          loc: undefined,
          flags: { dynamic: false }
        }
      ],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = renderer.renderIRNode(node, { visible });
    bridge.host.insert(bridge.root, rendered!);

    expect(bridge.root.children.some((child) => child.kind === "anchor")).toBe(true);
    expect(bridge.root.children.some((child) => child.kind === "element")).toBe(true);

    visible.set(false);
    await Promise.resolve();

    expect(bridge.root.children.some((child) => child.kind === "anchor")).toBe(true);
    expect(bridge.root.children.some((child) => child.kind === "element")).toBe(false);
    expect(bridge.root.children.some((child) => child.kind === "text" && (child as AndroidBridgeTextNode).value === "Hidden")).toBe(true);
  });

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