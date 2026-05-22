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

  it("normalizes switch toggle events and syncs checked state into the session tree", () => {
    const session = createAndroidHostSession();
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

    const rendered = session.mountIRNode(node, { checked, onChange }) as AndroidBridgeElementNode;
    const toggle = session.root.children[0] as AndroidNativeViewNode;

    expect(toggle.viewType).toBe("Switch");
    expect(toggle.props.checked).toBe(true);
    expect(toggle.subscribedEvents).toEqual(["change"]);

    session.dispatchNativeEvent(rendered.id, "toggle", { checked: false });

    expect(onChange).toHaveBeenCalledWith({ checked: false, on: false });
    expect(rendered.props.checked).toBe(false);
    expect(toggle.props.checked).toBe(false);
  });
});