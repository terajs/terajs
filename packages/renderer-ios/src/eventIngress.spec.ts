import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createUIKitHostSession,
  type UIKitBridgeElementNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios native event ingress", () => {
  it("normalizes text input events and syncs native text state into the session tree", () => {
    const session = createUIKitHostSession();
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

    const rendered = session.mountIRNode(node, { value, onInput }) as UIKitBridgeElementNode;
    const input = session.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextField");
    expect(input.props.text).toBe("Alpha");
    expect(input.subscribedEvents).toEqual(["change"]);

    session.dispatchNativeEvent(rendered.id, "input", { value: "Beta" });

    expect(onInput).toHaveBeenCalledWith({ value: "Beta", text: "Beta" });
    expect(rendered.props.text).toBe("Beta");
    expect(input.props.text).toBe("Beta");
  });
});