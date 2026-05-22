import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeAndroidProp,
  renderTerajsToAndroidViews,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android text layout props", () => {
  it("normalizes multiline line-count props to Android-facing names", () => {
    expect(normalizeAndroidProp("EditText", "rows", 3)).toEqual({
      name: "lines",
      value: 3
    });
    expect(normalizeAndroidProp("EditText", "minLines", 2)).toEqual({
      name: "minLines",
      value: 2
    });
    expect(normalizeAndroidProp("EditText", "maxRows", 6)).toEqual({
      name: "maxLines",
      value: 6
    });
  });

  it("renders Android textarea line-count props through the public entry point", async () => {
    const rows = signal(3);
    const minLines = signal(2);
    const maxRows = signal(6);
    const ir: IRModule = {
      filePath: "/native/android-text-layout.tera",
      template: [
        {
          type: "element",
          tag: "textarea",
          props: [
            {
              kind: "bind",
              name: "rows",
              value: "rows",
              binding: {
                kind: "simple-path",
                segments: ["rows"]
              }
            },
            {
              kind: "bind",
              name: "minLines",
              value: "minLines",
              binding: {
                kind: "simple-path",
                segments: ["minLines"]
              }
            },
            {
              kind: "bind",
              name: "maxRows",
              value: "maxRows",
              binding: {
                kind: "simple-path",
                segments: ["maxRows"]
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

    const rendered = renderTerajsToAndroidViews(ir, { rows, minLines, maxRows });
    const input = rendered.root.children[0] as AndroidNativeViewNode;

    expect(input.viewType).toBe("EditText");
    expect(input.props.lines).toBe(3);
    expect(input.props.minLines).toBe(2);
    expect(input.props.maxLines).toBe(6);

    rows.set(4);
    minLines.set(3);
    maxRows.set(8);
    await Promise.resolve();

    expect(input.props.lines).toBe(4);
    expect(input.props.minLines).toBe(3);
    expect(input.props.maxLines).toBe(8);

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});