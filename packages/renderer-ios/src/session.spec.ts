import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRIfNode, IRInterpolationNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createUIKitHostSession,
  type UIKitBridgeElementNode,
  type UIKitNativeTextNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios host session", () => {
  it("mounts IR into the UIKit native tree and dispatches events by node id", async () => {
    const session = createUIKitHostSession();
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

    const rendered = session.mountIRNode(node, { title, onTap }) as UIKitBridgeElementNode;
    const root = session.root;
    const button = root.children[0] as UIKitNativeViewNode;
    const text = button.children[0] as UIKitNativeTextNode;

    expect(button.viewType).toBe("ui-button");
    expect(button.props.accessibilityLabel).toBe("Alpha");
    expect(button.subscribedEvents).toEqual(["tap"]);
    expect(text.value).toBe("Alpha");
    expect(session.getNativeNode(rendered.id)).toBe(button);

    session.dispatchNativeEvent(rendered.id, "tap", { source: "native" });
    expect(onTap).toHaveBeenCalledWith({ source: "native" });

    title.set("Beta");
    await Promise.resolve();

    expect(button.props.accessibilityLabel).toBe("Beta");
    expect(text.value).toBe("Beta");

    session.removeNode(rendered.id);
    expect(root.children).toEqual([]);
  });

  it("replays control-flow updates through the UIKit host session without anchor leakage", async () => {
    const session = createUIKitHostSession();
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

    session.mountIRNode(node, { visible });

    const root = session.root;
    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeViewNode).viewType).toBe("ui-label");

    visible.set(false);
    await Promise.resolve();

    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeTextNode).value).toBe("Hidden");
  });

  it("removes top-level UIKit module control flow through the mounted module handle", async () => {
    const session = createUIKitHostSession();
    const visible = signal(true);
    const ir: IRModule = {
      filePath: "/native/ios-module.tera",
      template: [
        {
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
        } as IRIfNode
      ],
      meta: {} as IRModule["meta"],
      route: null
    };

    const mounted = session.mountIRModule(ir, { visible });
    const root = session.root;

    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeViewNode).viewType).toBe("ui-label");

    visible.set(false);
    await Promise.resolve();

    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeTextNode).value).toBe("Hidden");

    mounted.remove();
    expect(root.children).toEqual([]);

    visible.set(true);
    await Promise.resolve();

    expect(root.children).toEqual([]);
  });
});