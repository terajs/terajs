import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeAndroidProp,
  renderTerajsToAndroidViews,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android input prop normalization", () => {
  it("normalizes secure input and keyboard hints to Android traits", () => {
    expect(normalizeAndroidProp("EditText", "type", "password")).toEqual({
      name: "password",
      value: true
    });
    expect(normalizeAndroidProp("EditText", "inputMode", "email")).toEqual({
      name: "inputType",
      value: "textEmailAddress"
    });
    expect(normalizeAndroidProp("EditText", "enterKeyHint", "search")).toEqual({
      name: "imeOptions",
      value: "actionSearch"
    });
    expect(normalizeAndroidProp("EditText", "type", "text")).toEqual({
      name: "password",
      value: false
    });
  });

  it("renders Android input traits through the public entry point", async () => {
    const type = signal("password");
    const inputMode = signal("email");
    const enterKeyHint = signal("search");
    const ir: IRModule = {
      filePath: "/native/android-input-traits.tera",
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

    const rendered = renderTerajsToAndroidViews(ir, { type, inputMode, enterKeyHint });
    const input = rendered.root.children[0] as AndroidNativeViewNode;

    expect(input.viewType).toBe("EditText");
    expect(input.props.password).toBe(true);
    expect(input.props.inputType).toBe("textEmailAddress");
    expect(input.props.imeOptions).toBe("actionSearch");

    type.set("text");
    inputMode.set("decimal");
    enterKeyHint.set("done");
    await Promise.resolve();

    expect(input.props.password).toBe(false);
    expect(input.props.inputType).toBe("numberDecimal");
    expect(input.props.imeOptions).toBe("actionDone");

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});