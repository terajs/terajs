import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeUIKitProp,
  renderTerajsToUIKitViews,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios text viewport props", () => {
  it("normalizes multiline viewport props to UIKit-facing names", () => {
    expect(normalizeUIKitProp("UITextView", "scrollable", false)).toEqual({
      name: "scrollEnabled",
      value: false
    });
    expect(normalizeUIKitProp("UITextView", "contentInset", [8, 12])).toEqual({
      name: "textContainerInset",
      value: {
        top: 8,
        right: 12,
        bottom: 8,
        left: 12
      }
    });
  });

  it("renders UIKit textarea viewport props through the public entry point", async () => {
    const scrollEnabled = signal(false);
    const contentInset = signal<unknown>({ vertical: 8, horizontal: 12 });
    const ir: IRModule = {
      filePath: "/native/ios-text-viewport.tera",
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

    const rendered = renderTerajsToUIKitViews(ir, { scrollEnabled, contentInset });
    const input = rendered.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextView");
    expect(input.props.scrollEnabled).toBe(false);
    expect(input.props.textContainerInset).toEqual({
      top: 8,
      right: 12,
      bottom: 8,
      left: 12
    });

    scrollEnabled.set(true);
    contentInset.set([10, 14, 18, 22]);
    await Promise.resolve();

    expect(input.props.scrollEnabled).toBe(true);
    expect(input.props.textContainerInset).toEqual({
      top: 10,
      right: 14,
      bottom: 18,
      left: 22
    });

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});