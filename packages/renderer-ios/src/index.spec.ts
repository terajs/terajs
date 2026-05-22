import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRIfNode, IRInterpolationNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createUIKitCommandBridge,
  type UIKitBridgeElementNode,
  type UIKitBridgeTextNode,
} from "./index.js";

describe("renderer-ios bridge", () => {
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
        style: { textColor: "systemBlue" }
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
});