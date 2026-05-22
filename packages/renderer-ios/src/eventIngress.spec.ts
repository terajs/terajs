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

  it("normalizes text selection events and syncs selection state into the session tree", () => {
    const session = createUIKitHostSession();
    const value = signal("Alpha");
    const onSelect = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "textarea",
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
          name: "select",
          value: "onSelect"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, onSelect }) as UIKitBridgeElementNode;
    const input = session.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextView");
    expect(input.subscribedEvents).toEqual(["selectionchange"]);

    session.dispatchNativeEvent(rendered.id, "select", { start: 1, end: 4 });

    expect(onSelect).toHaveBeenCalledWith({
      start: 1,
      end: 4,
      selectionStart: 1,
      selectionEnd: 4,
      selection: { start: 1, end: 4 },
      selectionRange: { start: 1, end: 4 }
    });
    expect(rendered.props.selectionStart).toBe(1);
    expect(rendered.props.selectionEnd).toBe(4);
    expect(input.props.selectionStart).toBe(1);
    expect(input.props.selectionEnd).toBe(4);
  });

  it("normalizes structured text selection payloads into a canonical range shape", () => {
    const session = createUIKitHostSession();
    const value = signal("Alpha");
    const onSelect = vi.fn();
    const node: IRElementNode = {
      type: "element",
      tag: "textarea",
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
          name: "select",
          value: "onSelect"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, onSelect }) as UIKitBridgeElementNode;
    const input = session.root.children[0] as UIKitNativeViewNode;

    session.dispatchNativeEvent(rendered.id, "select", { selectionRange: [2, 5] });

    expect(onSelect).toHaveBeenCalledWith({
      selectionRange: { start: 2, end: 5 },
      start: 2,
      end: 5,
      selectionStart: 2,
      selectionEnd: 5,
      selection: { start: 2, end: 5 }
    });
    expect(rendered.props.selectionStart).toBe(2);
    expect(rendered.props.selectionEnd).toBe(5);
    expect(input.props.selectionStart).toBe(2);
    expect(input.props.selectionEnd).toBe(5);
  });

  it("normalizes composition payloads and syncs composition state into the session tree", () => {
    const session = createUIKitHostSession();
    const value = signal("Alpha");
    const onCompositionUpdate = vi.fn();
    const onCompositionEnd = vi.fn();
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
          name: "compositionUpdate",
          value: "onCompositionUpdate"
        },
        {
          kind: "event",
          name: "imeEnd",
          value: "onCompositionEnd"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, onCompositionUpdate, onCompositionEnd }) as UIKitBridgeElementNode;
    const input = session.root.children[0] as UIKitNativeViewNode;

    expect(input.viewType).toBe("UITextField");
    expect(input.subscribedEvents).toEqual(["compositionupdate", "compositionend"]);

    session.dispatchNativeEvent(rendered.id, "compositionupdate", { value: "Beta", data: "Be" });

    expect(onCompositionUpdate).toHaveBeenCalledWith({
      value: "Beta",
      text: "Beta",
      data: "Be",
      composition: "Be",
      composing: true,
      isComposing: true
    });
    expect(rendered.props.text).toBe("Beta");
    expect(rendered.props.composing).toBe(true);
    expect(rendered.props.compositionText).toBe("Be");
    expect(input.props.text).toBe("Beta");
    expect(input.props.composing).toBe(true);
    expect(input.props.compositionText).toBe("Be");

    session.dispatchNativeEvent(rendered.id, "compositionend", { value: "Beta", data: "Be" });

    expect(onCompositionEnd).toHaveBeenCalledWith({
      value: "Beta",
      text: "Beta",
      data: "Be",
      composition: "Be",
      composing: false,
      isComposing: false
    });
    expect(rendered.props.composing).toBe(false);
    expect(rendered.props.compositionText).toBeUndefined();
    expect(input.props.composing).toBe(false);
    expect(input.props.compositionText).toBeUndefined();
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