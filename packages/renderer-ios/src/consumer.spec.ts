import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRIfNode, IRInterpolationNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createUIKitCommandBridge,
  createUIKitCommandConsumer,
  type UIKitBridgeElementNode,
  type UIKitNativeTextNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios consumer", () => {
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