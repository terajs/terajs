import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRIfNode, IRInterpolationNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createSimulationHost,
  nextSimulationTick,
  simulationTextContent,
  type SimulationElementNode,
} from "../../renderer-web/src/testing/simulationHost.js";

import {
  createUIKitCommandBridge,
  createUIKitCommandConsumer,
  UIKitViewAdapter,
  renderTerajsToUIKitViews,
  type UIKitBridgeElementNode,
  type UIKitBridgeTextNode,
  type UIKitNativeTextNode,
  type UIKitNativeViewNode,
} from "./index.js";

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

  it("records thin UIKit host commands without sending JS handlers across the bridge", () => {
    const bridge = createUIKitCommandBridge();
    const label = bridge.host.createElement("UILabel");
    const text = bridge.host.createText("Hello native");
    const handler = vi.fn();

    bridge.host.insert(bridge.root, label);
    bridge.host.insert(label, text);
    bridge.host.setProp(label, "accessibilityLabel", "Greeting");
    bridge.host.setStyle(label, { color: "systemBlue" });
    bridge.host.setClass(label, "headline");
    bridge.host.addEvent(label, "tap", handler);
    bridge.dispatchEvent(label, "tap", { source: "native" });
    bridge.host.removeEvent(label, "tap", handler);
    bridge.host.remove(label);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ source: "native" });
    expect(bridge.commands).toEqual([
      {
        type: "create-element",
        nodeId: bridge.root.id,
        viewType: "UIView",
        svg: false
      },
      {
        type: "create-element",
        nodeId: label.id,
        viewType: "UILabel",
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
        childId: label.id,
        anchorId: null
      },
      {
        type: "insert",
        parentId: label.id,
        childId: text.id,
        anchorId: null
      },
      {
        type: "set-prop",
        nodeId: label.id,
        name: "accessibilityLabel",
        value: "Greeting"
      },
      {
        type: "set-style",
        nodeId: label.id,
        style: { color: "systemBlue" }
      },
      {
        type: "set-class",
        nodeId: label.id,
        className: "headline"
      },
      {
        type: "subscribe-event",
        nodeId: label.id,
        name: "tap"
      },
      {
        type: "unsubscribe-event",
        nodeId: label.id,
        name: "tap"
      },
      {
        type: "remove",
        nodeId: label.id
      }
    ]);
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

  it("renders compiler output through the UIKit command bridge", async () => {
    const bridge = createUIKitCommandBridge();
    const renderer = createHostIRRenderer({
      host: bridge.host,
      bindings: createHostBindings(bridge.host)
    });

    const title = signal("Alpha");
    const onTap = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "ui-button",
      props: [
        {
          kind: "bind",
          name: "accessibilityLabel",
          value: "title",
          binding: {
            kind: "simple-path",
            segments: ["title"]
          }
        },
        {
          kind: "event",
          name: "tap",
          value: "onTap"
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
      flags: { hasDirectives: true }
    };

    const rendered = renderer.renderIRNode(node, { title, onTap }) as UIKitBridgeElementNode;
    bridge.host.insert(bridge.root, rendered);

    expect(rendered.viewType).toBe("ui-button");
    expect(rendered.props.accessibilityLabel).toBe("Alpha");
    expect(rendered.children).toHaveLength(1);
    expect((rendered.children[0] as UIKitBridgeTextNode).value).toBe("Alpha");
    expect(bridge.commands.some((command) => command.type === "subscribe-event" && command.nodeId === rendered.id && command.name === "tap")).toBe(true);

    bridge.dispatchEvent(rendered, "tap", { action: "primary" });
    expect(onTap).toHaveBeenCalledWith({ action: "primary" });

    title.set("Beta");
    await Promise.resolve();

    expect(rendered.props.accessibilityLabel).toBe("Beta");
    expect((rendered.children[0] as UIKitBridgeTextNode).value).toBe("Beta");
  });

  it("keeps control-flow anchors JS-local while updating native-backed UIKit nodes", async () => {
    const bridge = createUIKitCommandBridge();
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
          tag: "ui-label",
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
    expect(bridge.commands.some((command) => "label" in command)).toBe(false);
    expect(bridge.root.children.some((child) => child.kind === "element")).toBe(true);

    visible.set(false);
    await Promise.resolve();

    expect(bridge.root.children.some((child) => child.kind === "anchor")).toBe(true);
    expect(bridge.root.children.some((child) => child.kind === "element")).toBe(false);
    expect(bridge.root.children.some((child) => child.kind === "text" && (child as UIKitBridgeTextNode).value === "Hidden")).toBe(true);
  });

  it("replays UIKit bridge commands into a package-local native view tree", async () => {
    const consumer = createUIKitCommandConsumer();
    const bridge = createUIKitCommandBridge({
      emitCommand(command) {
        consumer.applyCommand(command);
      }
    });
    const renderer = createHostIRRenderer({
      host: bridge.host,
      bindings: createHostBindings(bridge.host)
    });

    const title = signal("Alpha");
    const onTap = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "ui-button",
      props: [
        {
          kind: "bind",
          name: "accessibilityLabel",
          value: "title",
          binding: {
            kind: "simple-path",
            segments: ["title"]
          }
        },
        {
          kind: "event",
          name: "tap",
          value: "onTap"
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
      flags: { hasDirectives: true }
    };

    const rendered = renderer.renderIRNode(node, { title, onTap }) as UIKitBridgeElementNode;
    bridge.host.insert(bridge.root, rendered);

    const root = consumer.root as UIKitNativeViewNode;
    const button = root.children[0] as UIKitNativeViewNode;
    const text = button.children[0] as UIKitNativeTextNode;

    expect(root.viewType).toBe("UIView");
    expect(button.viewType).toBe("ui-button");
    expect(button.props.accessibilityLabel).toBe("Alpha");
    expect(button.subscribedEvents).toEqual(["tap"]);
    expect(text.value).toBe("Alpha");

    title.set("Beta");
    await Promise.resolve();

    expect(button.props.accessibilityLabel).toBe("Beta");
    expect(text.value).toBe("Beta");

    bridge.host.remove(rendered);
    expect(root.children).toEqual([]);
  });

  it("replays UIKit control flow into the native view tree without anchor leakage", async () => {
    const consumer = createUIKitCommandConsumer();
    const bridge = createUIKitCommandBridge({
      emitCommand(command) {
        consumer.applyCommand(command);
      }
    });
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
          tag: "ui-label",
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

    const root = consumer.root as UIKitNativeViewNode;
    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeViewNode).viewType).toBe("ui-label");

    visible.set(false);
    await Promise.resolve();

    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeTextNode).value).toBe("Hidden");
  });
});