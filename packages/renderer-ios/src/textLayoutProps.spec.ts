import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeUIKitProp,
  renderTerajsToUIKitViews,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios text layout props", () => {
  it("normalizes multiline line-count props to UIKit-facing names", () => {
    expect(normalizeUIKitProp("UITextView", "rows", 3)).toEqual({
      name: "preferredLineCount",
      value: 3
    });
    expect(normalizeUIKitProp("UITextView", "minRows", 2)).toEqual({
      name: "minimumLineCount",
      value: 2
    });
    expect(normalizeUIKitProp("UITextView", "maxLines", 6)).toEqual({
      name: "maximumLineCount",
      value: 6
    });
  });

  it("renders UIKit textarea line-count props through the public entry point", async () => {
    const rows = signal(3);
    const minRows = signal(2);
    const maxLines = signal(6);
    const ir: IRModule = {
      filePath: "/native/ios-text-layout.tera",
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
              name: "minRows",
              value: "minRows",
              binding: {
                kind: "simple-path",
                segments: ["minRows"]
              }
            },
            {
              kind: "bind",
              name: "maxLines",
              value: "maxLines",
              binding: {
                kind: "simple-path",
                segments: ["maxLines"]
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

    const rendered = renderTerajsToUIKitViews(ir, { rows, minRows, maxLines });
    const input = rendered.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextView");
    expect(input.props.preferredLineCount).toBe(3);
    expect(input.props.minimumLineCount).toBe(2);
    expect(input.props.maximumLineCount).toBe(6);

    rows.set(4);
    minRows.set(3);
    maxLines.set(8);
    await Promise.resolve();

    expect(input.props.preferredLineCount).toBe(4);
    expect(input.props.minimumLineCount).toBe(3);
    expect(input.props.maximumLineCount).toBe(8);

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});