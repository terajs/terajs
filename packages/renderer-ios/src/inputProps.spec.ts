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
    expect(normalizeUIKitProp("UITextView", "autocapitalize", "words")).toEqual({
      name: "autocapitalizationType",
      value: "words"
    });
    expect(normalizeUIKitProp("UITextView", "autocorrect", false)).toEqual({
      name: "autocorrectionType",
      value: "no"
    });
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

  it("renders UIKit textarea correction traits through the public entry point", async () => {
    const autocapitalize = signal("words");
    const autocorrect = signal(false);
    const ir: IRModule = {
      filePath: "/native/ios-textarea-traits.tera",
      template: [
        {
          type: "element",
          tag: "textarea",
          props: [
            {
              kind: "bind",
              name: "autocapitalize",
              value: "autocapitalize",
              binding: {
                kind: "simple-path",
                segments: ["autocapitalize"]
              }
            },
            {
              kind: "bind",
              name: "autocorrect",
              value: "autocorrect",
              binding: {
                kind: "simple-path",
                segments: ["autocorrect"]
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

    const rendered = renderTerajsToUIKitViews(ir, { autocapitalize, autocorrect });
    const input = rendered.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextView");
    expect(input.props.autocapitalizationType).toBe("words");
    expect(input.props.autocorrectionType).toBe("no");

    autocapitalize.set("characters");
    autocorrect.set(true);
    await Promise.resolve();

    expect(input.props.autocapitalizationType).toBe("allCharacters");
    expect(input.props.autocorrectionType).toBe("yes");

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });

  it("renders UIKit selection and caret props through the public entry point", async () => {
    const selectionStart = signal(1);
    const selectionEnd = signal(3);
    const caret = signal<number | null>(4);
    const ir: IRModule = {
      filePath: "/native/ios-selection-traits.tera",
      template: [
        {
          type: "element",
          tag: "textarea",
          props: [
            {
              kind: "bind",
              name: "selectionStart",
              value: "selectionStart",
              binding: {
                kind: "simple-path",
                segments: ["selectionStart"]
              }
            },
            {
              kind: "bind",
              name: "selectionEnd",
              value: "selectionEnd",
              binding: {
                kind: "simple-path",
                segments: ["selectionEnd"]
              }
            },
            {
              kind: "bind",
              name: "caret",
              value: "caret",
              binding: {
                kind: "simple-path",
                segments: ["caret"]
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

    const rendered = renderTerajsToUIKitViews(ir, { selectionStart, selectionEnd, caret });
    const input = rendered.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextView");
    expect(input.props.selectionStart).toBe(4);
    expect(input.props.selectionEnd).toBe(4);

    caret.set(null);
    selectionStart.set(2);
    selectionEnd.set(6);
    await Promise.resolve();

    expect(input.props.selectionStart).toBe(2);
    expect(input.props.selectionEnd).toBe(6);

    caret.set(7);
    await Promise.resolve();

    expect(input.props.selectionStart).toBe(7);
    expect(input.props.selectionEnd).toBe(7);

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});