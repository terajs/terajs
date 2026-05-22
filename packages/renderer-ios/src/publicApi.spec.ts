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
    expect(normalizeUIKitProp("UITextField", "hint", "Email address")).toEqual({
      name: "placeholder",
      value: "Email address"
    });
    expect(normalizeUIKitProp("UIImageView", "alt", "Hero artwork")).toEqual({
      name: "accessibilityLabel",
      value: "Hero artwork"
    });
    expect(normalizeUIKitProp("UISwitch", "checked", 1)).toEqual({
      name: "on",
      value: true
    });
    expect(normalizeUIKitEventName("UIButton", "click")).toBe("tap");
    expect(normalizeUIKitEventName("UISwitch", "toggle")).toBe("change");
    expect(normalizeUIKitEventName("UITextField", "compositionUpdate")).toBe("compositionupdate");
  });

  it("renders native input and image prop aliases through the UIKit entry point", async () => {
    const placeholder = signal("Email address");
    const source = signal("/hero-alpha.png");
    const alt = signal("Alpha hero artwork");
    const ir: IRModule = {
      filePath: "/native/ios-aliases.tera",
      template: [
        {
          type: "element",
          tag: "input",
          props: [
            {
              kind: "bind",
              name: "hint",
              value: "placeholder",
              binding: {
                kind: "simple-path",
                segments: ["placeholder"]
              }
            }
          ],
          children: [],
          loc: undefined,
          flags: { hasDirectives: true }
        } as IRElementNode,
        {
          type: "element",
          tag: "image",
          props: [
            {
              kind: "bind",
              name: "src",
              value: "source",
              binding: {
                kind: "simple-path",
                segments: ["source"]
              }
            },
            {
              kind: "bind",
              name: "alt",
              value: "alt",
              binding: {
                kind: "simple-path",
                segments: ["alt"]
              }
            }
          ],
          children: [],
          loc: undefined,
          flags: { hasDirectives: true }
        } as IRElementNode
      ],
      meta: {} as IRModule["meta"],
      route: null
    };

    const rendered = renderTerajsToUIKitViews(ir, { placeholder, source, alt });
    const root = rendered.root;
    const input = root.children[0] as UIKitNativeViewNode;
    const image = root.children[1] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextField");
    expect(input.props.placeholder).toBe("Email address");
    expect(image.viewType).toBe("UIImageView");
    expect(image.props.source).toBe("/hero-alpha.png");
    expect(image.props.accessibilityLabel).toBe("Alpha hero artwork");

    placeholder.set("Work email");
    source.set("/hero-beta.png");
    alt.set("Beta hero artwork");
    await Promise.resolve();

    expect(input.props.placeholder).toBe("Work email");
    expect(image.props.source).toBe("/hero-beta.png");
    expect(image.props.accessibilityLabel).toBe("Beta hero artwork");

    rendered.unmount();
    expect(root.children).toEqual([]);
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