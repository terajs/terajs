import { describe, expect, it } from "vitest";

import type { IRElementNode, IRIfNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createUIKitHostSession,
  type UIKitNativeTextNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios mounted module", () => {
  it("removes top-level UIKit module control flow through the mounted module handle", async () => {
    const session = createUIKitHostSession();
    const visible = signal(true);
    const ir: IRModule = {
      filePath: "/native/ios-module.tera",
      template: [
        {
          type: "if",
          condition: "visible",
          then: [
            {
              type: "element",
              tag: "ui-label",
              props: [],
              children: [
                {
                  type: "text",
                  value: "Visible",
                  loc: undefined,
                  flags: { dynamic: false }
                }
              ],
              loc: undefined,
              flags: { hasDirectives: false }
            } as IRElementNode
          ],
          else: [
            {
              type: "text",
              value: "Hidden",
              loc: undefined,
              flags: { dynamic: false }
            }
          ],
          loc: undefined,
          flags: { hasDirectives: true }
        } as IRIfNode
      ],
      meta: {} as IRModule["meta"],
      route: null
    };

    const mounted = session.mountIRModule(ir, { visible });
    const root = session.root;

    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeViewNode).viewType).toBe("UILabel");

    visible.set(false);
    await Promise.resolve();

    expect(root.children).toHaveLength(1);
    expect((root.children[0] as UIKitNativeTextNode).value).toBe("Hidden");

    mounted.remove();
    expect(root.children).toEqual([]);

    visible.set(true);
    await Promise.resolve();

    expect(root.children).toEqual([]);
  });
});