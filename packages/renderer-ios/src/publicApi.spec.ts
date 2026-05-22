import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRInterpolationNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeUIKitEventName,
  normalizeUIKitProp,
  UIKitViewAdapter,
  renderTerajsToUIKitViews,
  resolveUIKitViewType,
  type UIKitNativeTextNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios public API", () => {
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
});