import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRInterpolationNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  AndroidViewAdapter,
  normalizeAndroidEventName,
  normalizeAndroidProp,
  renderTerajsToAndroidViews,
  resolveAndroidViewType,
  type AndroidNativeTextNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android public API", () => {
  it("creates, inserts, updates, and removes Android host nodes", () => {
    const root = AndroidViewAdapter.createElement("section");
    const child = AndroidViewAdapter.createElement("button");

    AndroidViewAdapter.insert(root, child);
    AndroidViewAdapter.setProp(child, "text", "Hello native");

    expect(root.children).toEqual([child]);
    expect(child.parent).toBe(root);
    expect(root.type).toBe("ViewGroup");
    expect(child.type).toBe("Button");
    expect(child.props.text).toBe("Hello native");

    AndroidViewAdapter.remove(child);

    expect(root.children).toEqual([]);
    expect(child.parent).toBeNull();
  });

  it("maps standard and native-flavored Android tags to Android primitives", () => {
    expect(resolveAndroidViewType("button")).toBe("Button");
    expect(resolveAndroidViewType("text-view")).toBe("TextView");
    expect(resolveAndroidViewType("TextView")).toBe("TextView");
  });

  it("normalizes standard Android props and events to native names", () => {
    expect(normalizeAndroidProp("Button", "aria-label", "Primary")).toEqual({
      name: "contentDescription",
      value: "Primary"
    });
    expect(normalizeAndroidProp("EditText", "value", "Alpha")).toEqual({
      name: "text",
      value: "Alpha"
    });
    expect(normalizeAndroidProp("EditText", "placeholder", "Email address")).toEqual({
      name: "hint",
      value: "Email address"
    });
    expect(normalizeAndroidProp("ImageView", "alt", "Hero artwork")).toEqual({
      name: "contentDescription",
      value: "Hero artwork"
    });
    expect(normalizeAndroidProp("Switch", "on", 1)).toEqual({
      name: "checked",
      value: true
    });
    expect(normalizeAndroidEventName("Button", "click")).toBe("press");
    expect(normalizeAndroidEventName("Switch", "toggle")).toBe("change");
  });

  it("renders native input and image prop aliases through the Android entry point", async () => {
    const placeholder = signal("Email address");
    const source = signal("/hero-alpha.png");
    const alt = signal("Alpha hero artwork");
    const ir: IRModule = {
      filePath: "/native/android-aliases.tera",
      template: [
        {
          type: "element",
          tag: "input",
          props: [
            {
              kind: "bind",
              name: "placeholder",
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
              name: "source",
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

    const rendered = renderTerajsToAndroidViews(ir, { placeholder, source, alt });
    const root = rendered.root;
    const input = root.children[0] as AndroidNativeViewNode;
    const image = root.children[1] as AndroidNativeViewNode;

    expect(input.viewType).toBe("EditText");
    expect(input.props.hint).toBe("Email address");
    expect(image.viewType).toBe("ImageView");
    expect(image.props.source).toBe("/hero-alpha.png");
    expect(image.props.contentDescription).toBe("Alpha hero artwork");

    placeholder.set("Work email");
    source.set("/hero-beta.png");
    alt.set("Beta hero artwork");
    await Promise.resolve();

    expect(input.props.hint).toBe("Work email");
    expect(image.props.source).toBe("/hero-beta.png");
    expect(image.props.contentDescription).toBe("Beta hero artwork");

    rendered.unmount();
    expect(root.children).toEqual([]);
  });

  it("renders compiler IR modules through the public Android entry point", async () => {
    const label = signal("Alpha");
    const onPress = vi.fn();
    const ir: IRModule = {
      filePath: "/native/android.tera",
      template: [
        {
          type: "element",
          tag: "button",
          props: [
            {
              kind: "bind",
              name: "aria-label",
              value: "label",
              binding: {
                kind: "simple-path",
                segments: ["label"]
              }
            },
            {
              kind: "event",
              name: "click",
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
        } as IRElementNode
      ],
      meta: {} as IRModule["meta"],
      route: null
    };

    const rendered = renderTerajsToAndroidViews(ir, { label, onPress });
    const root = rendered.root;
    const button = root.children[0] as AndroidNativeViewNode;
    const text = button.children[0] as AndroidNativeTextNode;

    expect(root.viewType).toBe("ViewGroup");
    expect(button.viewType).toBe("Button");
    expect(button.props.contentDescription).toBe("Alpha");
    expect(button.subscribedEvents).toEqual(["press"]);
    expect(text.value).toBe("Alpha");

    rendered.session.dispatchNativeEvent(button.id, "press", { source: "native" });
    expect(onPress).toHaveBeenCalledWith({ source: "native" });

    label.set("Beta");
    await Promise.resolve();

    expect(button.props.contentDescription).toBe("Beta");
    expect(text.value).toBe("Beta");

    rendered.unmount();
    expect(root.children).toEqual([]);
  });
});