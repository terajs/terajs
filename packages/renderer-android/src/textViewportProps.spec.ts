import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeAndroidProp,
  renderTerajsToAndroidViews,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android text viewport props", () => {
  it("normalizes multiline viewport props to Android-facing names", () => {
    expect(normalizeAndroidProp("EditText", "scrollable", false)).toEqual({
      name: "scrollEnabled",
      value: false
    });
    expect(normalizeAndroidProp("EditText", "contentInset", { vertical: 6, horizontal: 10 })).toEqual({
      name: "contentPadding",
      value: {
        top: 6,
        right: 10,
        bottom: 6,
        left: 10
      }
    });
  });

  it("renders Android textarea viewport props through the public entry point", async () => {
    const scrollEnabled = signal(false);
    const contentInset = signal<unknown>({ vertical: 6, horizontal: 10 });
    const ir: IRModule = {
      filePath: "/native/android-text-viewport.tera",
      template: [
        {
          type: "element",
          tag: "textarea",
          props: [
            {
              kind: "bind",
              name: "scrollEnabled",
              value: "scrollEnabled",
              binding: {
                kind: "simple-path",
                segments: ["scrollEnabled"]
              }
            },
            {
              kind: "bind",
              name: "contentInset",
              value: "contentInset",
              binding: {
                kind: "simple-path",
                segments: ["contentInset"]
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

    const rendered = renderTerajsToAndroidViews(ir, { scrollEnabled, contentInset });
    const input = rendered.root.children[0] as AndroidNativeViewNode;

    expect(input.viewType).toBe("EditText");
    expect(input.props.scrollEnabled).toBe(false);
    expect(input.props.contentPadding).toEqual({
      top: 6,
      right: 10,
      bottom: 6,
      left: 10
    });

    scrollEnabled.set(true);
    contentInset.set([12, 16, 20, 24]);
    await Promise.resolve();

    expect(input.props.scrollEnabled).toBe(true);
    expect(input.props.contentPadding).toEqual({
      top: 12,
      right: 16,
      bottom: 20,
      left: 24
    });

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});