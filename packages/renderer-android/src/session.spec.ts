import { describe, expect, it, vi } from "vitest";

import type { IRElementNode, IRForNode, IRIfNode, IRInterpolationNode, IRModule } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createAndroidHostSession,
  type AndroidBridgeElementNode,
  type AndroidNativeTextNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android host session", () => {
  it("mounts IR into the Android native tree and dispatches events by node id", async () => {
    const session = createAndroidHostSession();
    const label = signal("Alpha");
    const onPress = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "button-view",
      props: [
        {
          kind: "bind",
          name: "contentDescription",
          value: "label",
          binding: {
            kind: "simple-path",
            segments: ["label"]
          }
        },
        {
          kind: "event",
          name: "press",
          value: "onPress"
        }
      ],
      children: [
        {
          type: "interp",
          expression: "label",
          loc: undefined,
          flags: { dynamic: true }
        } as IRInterpolationNode
      ],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { label, onPress }) as AndroidBridgeElementNode;
    const root = session.root;
    const button = root.children[0] as AndroidNativeViewNode;
    const text = button.children[0] as AndroidNativeTextNode;

    expect(button.viewType).toBe("button-view");
    expect(button.props.contentDescription).toBe("Alpha");
    expect(button.subscribedEvents).toEqual(["press"]);
    expect(text.value).toBe("Alpha");
    expect(session.getNativeNode(rendered.id)).toBe(button);

    session.dispatchNativeEvent(rendered.id, "press", { source: "native" });
    expect(onPress).toHaveBeenCalledWith({ source: "native" });

    label.set("Beta");
    await Promise.resolve();

    expect(button.props.contentDescription).toBe("Beta");
    expect(text.value).toBe("Beta");
  });

  it("replays keyed Android rows through the host session consumer tree", async () => {
    const session = createAndroidHostSession();
    const items = signal([
      { id: "a", label: "A" },
      { id: "b", label: "B" }
    ]);
    const node: IRForNode = {
      type: "for",
      each: "items",
      item: "item",
      index: "i",
      body: [
        {
          type: "element",
          tag: "text-view",
          props: [],
          children: [
            {
              type: "interp",
              expression: "item.label",
              loc: undefined,
              flags: { dynamic: true }
            } as IRInterpolationNode
          ],
          loc: undefined,
          flags: { hasDirectives: false }
        } as IRElementNode
      ],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    session.mountIRNode(node, { items });

    const root = session.root;
    const firstRow = root.children[0] as AndroidNativeViewNode;
    const secondRow = root.children[1] as AndroidNativeViewNode;

    expect((firstRow.children[0] as AndroidNativeTextNode).value).toBe("A");
    expect((secondRow.children[0] as AndroidNativeTextNode).value).toBe("B");

    items.set([
      { id: "b", label: "B2" },
      { id: "a", label: "A" }
    ]);
    await Promise.resolve();

    const reorderedFirstRow = root.children[0] as AndroidNativeViewNode;
    const reorderedSecondRow = root.children[1] as AndroidNativeViewNode;
    expect(reorderedFirstRow.id).toBe(secondRow.id);
    expect(reorderedSecondRow.id).toBe(firstRow.id);
    expect((reorderedFirstRow.children[0] as AndroidNativeTextNode).value).toBe("B2");
    expect((reorderedSecondRow.children[0] as AndroidNativeTextNode).value).toBe("A");
  });

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
    expect((root.children[0] as AndroidNativeViewNode).viewType).toBe("text-view");

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