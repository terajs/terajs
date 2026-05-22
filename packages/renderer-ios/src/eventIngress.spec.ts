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

  it("normalizes switch toggle events and syncs checked state into the session tree", () => {
    const session = createUIKitHostSession();
    const checked = signal(true);
    const onChange = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "switch",
      props: [
        {
          kind: "bind",
          name: "checked",
          value: "checked",
          binding: {
            kind: "simple-path",
            segments: ["checked"]
          }
        },
        {
          kind: "event",
          name: "toggle",
          value: "onChange"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { checked, onChange }) as UIKitBridgeElementNode;
    const toggle = session.root.children[0] as UIKitNativeViewNode;

    expect(toggle.viewType).toBe("UISwitch");
    expect(toggle.props.on).toBe(true);
    expect(toggle.subscribedEvents).toEqual(["change"]);

    session.dispatchNativeEvent(rendered.id, "toggle", { on: false });

    expect(onChange).toHaveBeenCalledWith({ on: false, checked: false });
    expect(rendered.props.on).toBe(false);
    expect(toggle.props.on).toBe(false);
  });
});