import { describe, expect, it } from "vitest";

import type { IRElementNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  normalizeAndroidProp,
  renderTerajsToAndroidViews,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android text limit props", () => {
  it("normalizes text-entry limit props to Android-facing names", () => {
    expect(normalizeAndroidProp("EditText", "maxLength", 24)).toEqual({
      name: "maxLength",
      value: 24
    });
    expect(normalizeAndroidProp("EditText", "characterLimit", "80")).toEqual({
      name: "maxLength",
      value: 80
    });
  });

  it("renders Android text-entry limit props through the public entry point", async () => {
    const limit = signal(24);
    const ir: IRModule = {
      filePath: "/native/android-text-limits.tera",
      template: [
        {
          type: "element",
          tag: "textarea",
          props: [
            {
              kind: "bind",
              name: "maxLength",
              value: "limit",
              binding: {
                kind: "simple-path",
                segments: ["limit"]
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

    const rendered = renderTerajsToAndroidViews(ir, { limit });
    const input = rendered.root.children[0] as AndroidNativeViewNode;

    expect(input.viewType).toBe("EditText");
    expect(input.props.maxLength).toBe(24);

    limit.set(48);
    await Promise.resolve();

    expect(input.props.maxLength).toBe(48);

    rendered.unmount();
    expect(rendered.root.children).toEqual([]);
  });
});