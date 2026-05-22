import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeAndroidProp,
  renderTerajsToAndroidViews,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android selection props", () => {
  it("normalizes selection and caret props to Android-facing names", () => {
    expect(normalizeAndroidProp("EditText", "selectionEnd", 3)).toEqual({
      name: "selectionEnd",
      value: 3
    });
    expect(normalizeAndroidProp("EditText", "caret", 5)).toEqual({
      name: "selectionStart",
      value: 5,
      additional: [{
        name: "selectionEnd",
        value: 5
      }]
    });
    expect(normalizeAndroidProp("EditText", "selectionRange", { start: 1, end: 4 })).toEqual({
      name: "selectionStart",
      value: 1,
      additional: [{
        name: "selectionEnd",
        value: 4
      }]
    });
    expect(normalizeAndroidProp("EditText", "selection", [3, 7])).toEqual({
      name: "selectionStart",
      value: 3,
      additional: [{
        name: "selectionEnd",
        value: 7
      }]
    });
  });

  it("renders Android structured selection props through the public entry point", async () => {
    const selection = signal<{
      start?: number;
      end?: number;
      selectionStart?: number;
      selectionEnd?: number;
    }>({ start: 1, end: 4 });
    const ir: IRModule = {
      filePath: "/native/android-selection-range.tera",
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

    const rendered = renderTerajsToAndroidViews(ir, { selection });
    const input = rendered.root.children[0] as AndroidNativeViewNode;

    expect(input.viewType).toBe("EditText");
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