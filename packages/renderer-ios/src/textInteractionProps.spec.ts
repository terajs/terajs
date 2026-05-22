import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeUIKitProp,
  renderTerajsToUIKitViews,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios text interaction props", () => {
  it("normalizes textarea interaction props to UIKit-facing names", () => {
    expect(normalizeUIKitProp("UITextView", "readOnly", true)).toEqual({
      name: "editable",
      value: false
    });
    expect(normalizeUIKitProp("UITextView", "textSelectable", true)).toEqual({
      name: "selectable",
      value: true
    });
  });

  it("renders UIKit textarea interaction props through the public entry point", async () => {
    const readOnly = signal(true);
    const selectable = signal(false);
    const ir: IRModule = {
      filePath: "/native/ios-text-interaction.tera",
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

    const rendered = renderTerajsToUIKitViews(ir, { readOnly, selectable });
    const input = rendered.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextView");
    expect(input.props.editable).toBe(false);
    expect(input.props.selectable).toBe(false);

    readOnly.set(false);
    selectable.set(true);
    await Promise.resolve();

    expect(input.props.editable).toBe(true);
    expect(input.props.selectable).toBe(true);

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});