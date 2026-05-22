import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeAndroidProp,
  renderTerajsToAndroidViews,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android text interaction props", () => {
  it("normalizes text-entry interaction props to Android-facing names", () => {
    expect(normalizeAndroidProp("EditText", "readOnly", true)).toEqual({
      name: "editable",
      value: false
    });
    expect(normalizeAndroidProp("EditText", "selectionEnabled", true)).toEqual({
      name: "textIsSelectable",
      value: true
    });
  });

  it("renders Android textarea interaction props through the public entry point", async () => {
    const readOnly = signal(true);
    const selectable = signal(false);
    const ir: IRModule = {
      filePath: "/native/android-text-interaction.tera",
      template: [
        {
          type: "element",
          tag: "textarea",
          props: [
            {
              kind: "bind",
              name: "readOnly",
              value: "readOnly",
              binding: {
                kind: "simple-path",
                segments: ["readOnly"]
              }
            },
            {
              kind: "bind",
              name: "selectable",
              value: "selectable",
              binding: {
                kind: "simple-path",
                segments: ["selectable"]
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

    const rendered = renderTerajsToAndroidViews(ir, { readOnly, selectable });
    const input = rendered.root.children[0] as AndroidNativeViewNode;

    expect(input.viewType).toBe("EditText");
    expect(input.props.editable).toBe(false);
    expect(input.props.textIsSelectable).toBe(false);

    readOnly.set(false);
    selectable.set(true);
    await Promise.resolve();

    expect(input.props.editable).toBe(true);
    expect(input.props.textIsSelectable).toBe(true);

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});