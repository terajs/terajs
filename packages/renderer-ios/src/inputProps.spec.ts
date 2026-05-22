import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeUIKitProp,
  renderTerajsToUIKitViews,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios input prop normalization", () => {
  it("normalizes secure input and keyboard hints to UIKit traits", () => {
    expect(normalizeUIKitProp("UITextField", "type", "password")).toEqual({
      name: "secureTextEntry",
      value: true
    });
    expect(normalizeUIKitProp("UITextField", "inputMode", "email")).toEqual({
      name: "keyboardType",
      value: "emailAddress"
    });
    expect(normalizeUIKitProp("UITextField", "enterKeyHint", "search")).toEqual({
      name: "returnKeyType",
      value: "search"
    });
    expect(normalizeUIKitProp("UITextField", "type", "text")).toEqual({
      name: "secureTextEntry",
      value: false
    });
  });

  it("renders UIKit input traits through the public entry point", async () => {
    const type = signal("password");
    const inputMode = signal("email");
    const enterKeyHint = signal("search");
    const ir: IRModule = {
      filePath: "/native/ios-input-traits.tera",
      template: [
        {
          type: "element",
          tag: "input",
          props: [
            {
              kind: "bind",
              name: "type",
              value: "type",
              binding: {
                kind: "simple-path",
                segments: ["type"]
              }
            },
            {
              kind: "bind",
              name: "inputMode",
              value: "inputMode",
              binding: {
                kind: "simple-path",
                segments: ["inputMode"]
              }
            },
            {
              kind: "bind",
              name: "enterKeyHint",
              value: "enterKeyHint",
              binding: {
                kind: "simple-path",
                segments: ["enterKeyHint"]
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

    const rendered = renderTerajsToUIKitViews(ir, { type, inputMode, enterKeyHint });
    const input = rendered.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextField");
    expect(input.props.secureTextEntry).toBe(true);
    expect(input.props.keyboardType).toBe("emailAddress");
    expect(input.props.returnKeyType).toBe("search");

    type.set("text");
    inputMode.set("decimal");
    enterKeyHint.set("done");
    await Promise.resolve();

    expect(input.props.secureTextEntry).toBe(false);
    expect(input.props.keyboardType).toBe("decimalPad");
    expect(input.props.returnKeyType).toBe("done");

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});