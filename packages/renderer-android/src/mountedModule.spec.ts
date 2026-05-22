import { describe, expect, it } from "vitest";

import type { IRElementNode, IRIfNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createAndroidHostSession,
  type AndroidNativeTextNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android mounted module", () => {
  it("removes top-level Android module control flow through the mounted module handle", async () => {
    const session = createAndroidHostSession();
    const visible = signal(true);
    const ir: IRModule = {
      filePath: "/native/android-module.tera",
      template: [
        {
          type: "if",
          condition: "visible",
          then: [
            {
              type: "element",
              tag: "text-view",
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
    expect((root.children[0] as AndroidNativeViewNode).viewType).toBe("TextView");

    visible.set(false);
    await Promise.resolve();

    expect(root.children).toHaveLength(1);
    expect((root.children[0] as AndroidNativeTextNode).value).toBe("Hidden");

    mounted.remove();
    expect(root.children).toEqual([]);

    visible.set(true);
    await Promise.resolve();

    expect(root.children).toEqual([]);
  });
});