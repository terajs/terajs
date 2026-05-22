import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeUIKitProp,
  renderTerajsToUIKitViews,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios text limit props", () => {
  it("normalizes text-entry limit props to UIKit-facing names", () => {
    expect(normalizeUIKitProp("UITextField", "maxLength", 24)).toEqual({
      name: "maximumTextLength",
      value: 24
    });
    expect(normalizeUIKitProp("UITextView", "characterLimit", "80")).toEqual({
      name: "maximumTextLength",
      value: 80
    });
  });

  it("renders UIKit text-entry limit props through the public entry point", async () => {
    const inputLimit = signal(24);
    const textareaLimit = signal(80);
    const ir: IRModule = {
      filePath: "/native/ios-text-limits.tera",
      template: [
        {
          type: "element",
          tag: "input",
          props: [
            {
              kind: "bind",
              name: "maxLength",
              value: "inputLimit",
              binding: {
                kind: "simple-path",
                segments: ["inputLimit"]
              }
            }
          ],
          children: [],
          loc: undefined,
          flags: { hasDirectives: true }
        } as IRElementNode,
        {
          type: "element",
          tag: "textarea",
          props: [
            {
              kind: "bind",
              name: "characterLimit",
              value: "textareaLimit",
              binding: {
                kind: "simple-path",
                segments: ["textareaLimit"]
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

    const rendered = renderTerajsToUIKitViews(ir, { inputLimit, textareaLimit });
    const input = rendered.root.children[0] as UIKitNativeViewNode;
    const textarea = rendered.root.children[1] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextField");
    expect(input.props.maximumTextLength).toBe(24);
    expect(textarea.viewType).toBe("UITextView");
    expect(textarea.props.maximumTextLength).toBe(80);

    inputLimit.set(40);
    textareaLimit.set(120);
    await Promise.resolve();

    expect(input.props.maximumTextLength).toBe(40);
    expect(textarea.props.maximumTextLength).toBe(120);

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});