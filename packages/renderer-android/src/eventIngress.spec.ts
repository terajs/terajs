import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createAndroidHostSession,
  type AndroidBridgeElementNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android native event ingress", () => {
  it("normalizes text input events and syncs native text state into the session tree", () => {
    const session = createAndroidHostSession();
    const value = signal("Alpha");
    const onInput = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "input",
      props: [
        {
          kind: "bind",
          name: "value",
          value: "value",
          binding: {
            kind: "simple-path",
            segments: ["value"]
          }
        },
        {
          kind: "event",
          name: "input",
          value: "onInput"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, onInput }) as AndroidBridgeElementNode;
    const input = session.root.children[0] as AndroidNativeViewNode;

    expect(input.viewType).toBe("EditText");
    expect(input.props.text).toBe("Alpha");
    expect(input.subscribedEvents).toEqual(["change"]);

    session.dispatchNativeEvent(rendered.id, "input", { text: "Beta" });

    expect(onInput).toHaveBeenCalledWith({ text: "Beta", value: "Beta" });
    expect(rendered.props.text).toBe("Beta");
    expect(input.props.text).toBe("Beta");
  });
});