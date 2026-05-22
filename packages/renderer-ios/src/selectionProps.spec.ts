import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeUIKitProp,
  renderTerajsToUIKitViews,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios selection props", () => {
  it("normalizes selection and caret props to UIKit-facing names", () => {
    expect(normalizeUIKitProp("UITextView", "selectionStart", 2)).toEqual({
      name: "selectionStart",
      value: 2
    });
    expect(normalizeUIKitProp("UITextView", "caret", 5)).toEqual({
      name: "selectionStart",
      value: 5,
      additional: [{
        name: "selectionEnd",
        value: 5
      }]
    });
    expect(normalizeUIKitProp("UITextView", "selectionRange", { start: 1, end: 4 })).toEqual({
      name: "selectionStart",
      value: 1,
      additional: [{
        name: "selectionEnd",
        value: 4
      }]
    });
    expect(normalizeUIKitProp("UITextView", "selection", [3, 7])).toEqual({
      name: "selectionStart",
      value: 3,
      additional: [{
        name: "selectionEnd",
        value: 7
      }]
    });
  });

  it("renders UIKit structured selection props through the public entry point", async () => {
    const selection = signal({ start: 1, end: 4 });
    const ir: IRModule = {
      filePath: "/native/ios-selection-range.tera",
      template: [
        {
          type: "element",
          tag: "textarea",
          props: [
            {
              kind: "bind",
              name: "selectionRange",
              value: "selection",
              binding: {
                kind: "simple-path",
                segments: ["selection"]
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

    const rendered = renderTerajsToUIKitViews(ir, { selection });
    const input = rendered.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextView");
    expect(input.props.selectionStart).toBe(1);
    expect(input.props.selectionEnd).toBe(4);

    selection.set({ selectionStart: 2, selectionEnd: 6 });
    await Promise.resolve();

    expect(input.props.selectionStart).toBe(2);
    expect(input.props.selectionEnd).toBe(6);

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});