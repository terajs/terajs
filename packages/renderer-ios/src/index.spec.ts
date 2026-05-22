import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRIfNode, IRInterpolationNode, IRModule } from "@terajs/compiler";
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
  normalizeUIKitEventName,
  normalizeUIKitProp,
  UIKitViewAdapter,
  renderTerajsToUIKitViews,
  resolveUIKitViewType,
  type UIKitBridgeElementNode,
  type UIKitBridgeTextNode,
  type UIKitNativeTextNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios stub", () => {
  it("creates, inserts, updates, and removes UIKit host nodes", () => {
    const root = UIKitViewAdapter.createElement("div");
    const child = UIKitViewAdapter.createElement("button");

    UIKitViewAdapter.insert(root, child);
    UIKitViewAdapter.setProp(child, "text", "Hello native");

    expect(root.children).toEqual([child]);
    expect(child.parent).toBe(root);
    expect(root.type).toBe("UIView");
    expect(child.type).toBe("UIButton");
    expect(child.props.text).toBe("Hello native");

    UIKitViewAdapter.remove(child);

    expect(root.children).toEqual([]);
    expect(child.parent).toBeNull();
  });

  it("maps standard and native-flavored iOS tags to UIKit primitives", () => {
    expect(resolveUIKitViewType("button")).toBe("UIButton");
    expect(resolveUIKitViewType("ui-label")).toBe("UILabel");
    expect(resolveUIKitViewType("UILabel")).toBe("UILabel");
  });

  it("normalizes standard iOS props and events to native names", () => {
    expect(normalizeUIKitProp("UIButton", "aria-label", "Primary")).toEqual({
      name: "accessibilityLabel",
      value: "Primary"
    });
    expect(normalizeUIKitProp("UITextField", "value", "Alpha")).toEqual({
      name: "text",
      value: "Alpha"
    });
    expect(normalizeUIKitEventName("UIButton", "click")).toBe("tap");
  });

  it("renders compiler IR modules through the public UIKit entry point", async () => {
    const title = signal("Alpha");
    const onTap = vi.fn();
    const ir: IRModule = {
      filePath: "/native/ios.tera",
      template: [
        {
          type: "element",
          tag: "button",
          props: [
            {
              kind: "bind",
              name: "aria-label",
              value: "title",
              binding: {
                kind: "simple-path",
                segments: ["title"]
              }
            },
            {
              kind: "event",
              name: "click",
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
        } as IRElementNode
      ],
      meta: {} as IRModule["meta"],
      route: null
    };

    const rendered = renderTerajsToUIKitViews(ir, { title, onTap });
    const root = rendered.root;
    const button = root.children[0] as UIKitNativeViewNode;
    const text = button.children[0] as UIKitNativeTextNode;

    expect(root.viewType).toBe("UIView");
  expect(button.viewType).toBe("UIButton");
    expect(button.props.accessibilityLabel).toBe("Alpha");
    expect(button.subscribedEvents).toEqual(["tap"]);
    expect(text.value).toBe("Alpha");

    rendered.session.dispatchNativeEvent(button.id, "tap", { source: "native" });
    expect(onTap).toHaveBeenCalledWith({ source: "native" });

    title.set("Beta");
    await Promise.resolve();

    expect(button.props.accessibilityLabel).toBe("Beta");
    expect(text.value).toBe("Beta");

    rendered.unmount();
    expect(root.children).toEqual([]);
  });

  it("records thin UIKit host commands without sending JS handlers across the bridge", () => {
    const bridge = createUIKitCommandBridge();
    const label = bridge.host.createElement("button");
    const text = bridge.host.createText("Hello native");
    const handler = vi.fn();

    bridge.host.insert(bridge.root, label);
    bridge.host.insert(label, text);
    bridge.host.setProp(label, "aria-label", "Greeting");
    bridge.host.setStyle(label, { color: "systemBlue" });
    bridge.host.setClass(label, "headline");
    bridge.host.addEvent(label, "click", handler);
    bridge.dispatchEvent(label, "tap", { source: "native" });
    bridge.host.removeEvent(label, "click", handler);
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
        viewType: "UIButton",
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

    expect(rendered.viewType).toBe("UIButton");
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
    expect(button.viewType).toBe("UIButton");
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
    expect((root.children[0] as UIKitNativeViewNode).viewType).toBe("UILabel");

    visible.set(false);
    await Promise.resolve();

    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeTextNode).value).toBe("Hidden");
  });
});