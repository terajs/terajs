import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createUIKitHostSession,
  type UIKitBridgeElementNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios transfer beforeinput ingress", () => {
  it("extracts pasted text from clipboard payloads and infers the paste input type", () => {
    const session = createUIKitHostSession();
    const value = signal("Alpha");
    const onBeforeInput = vi.fn();
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
          name: "beforeInput",
          value: "onBeforeInput"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, onBeforeInput }) as UIKitBridgeElementNode;
    const input = session.root.children[0] as UIKitNativeViewNode;

    rendered.props.selectionStart = 1;
    rendered.props.selectionEnd = 3;
    input.props.selectionStart = 1;
    input.props.selectionEnd = 3;

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      clipboardData: { "text/plain": "eta" }
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      clipboardData: { "text/plain": "eta" },
      text: "Aetaha",
      value: "Aetaha",
      data: "eta",
      inputType: "insertFromPaste",
      replacementRange: { start: 1, end: 3 },
      start: 4,
      end: 4,
      selectionStart: 4,
      selectionEnd: 4,
      selection: { start: 4, end: 4 },
      selectionRange: { start: 4, end: 4 }
    });
    expect(rendered.props.text).toBe("Aetaha");
    expect(rendered.props.selectionStart).toBe(4);
    expect(rendered.props.selectionEnd).toBe(4);
    expect(input.props.text).toBe("Aetaha");
  });

  it("extracts dropped text from dataTransfer payloads", () => {
    const session = createUIKitHostSession();
    const value = signal("Alpha\nBravo\nCharlie");
    const onBeforeInput = vi.fn();
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
          name: "beforeInput",
          value: "onBeforeInput"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, onBeforeInput }) as UIKitBridgeElementNode;
    const input = session.root.children[0] as UIKitNativeViewNode;

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      dataTransfer: { text: "Beta\nDelta" },
      targetRange: [6, 11]
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      dataTransfer: { text: "Beta\nDelta" },
      targetRange: [6, 11],
      text: "Alpha\nBeta\nDelta\nCharlie",
      value: "Alpha\nBeta\nDelta\nCharlie",
      data: "Beta\nDelta",
      inputType: "insertFromDrop",
      replacementRange: { start: 6, end: 11 },
      start: 16,
      end: 16,
      selectionStart: 16,
      selectionEnd: 16,
      selection: { start: 16, end: 16 },
      selectionRange: { start: 16, end: 16 }
    });
    expect(input.viewType).toBe("UITextView");
    expect(rendered.props.text).toBe("Alpha\nBeta\nDelta\nCharlie");
    expect(rendered.props.selectionStart).toBe(16);
    expect(rendered.props.selectionEnd).toBe(16);
    expect(input.props.text).toBe("Alpha\nBeta\nDelta\nCharlie");
  });

  it("derives delete-by-cut previews from the current selection", () => {
    const session = createUIKitHostSession();
    const value = signal("Alpha");
    const onBeforeInput = vi.fn();
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
          name: "beforeInput",
          value: "onBeforeInput"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, onBeforeInput }) as UIKitBridgeElementNode;
    const input = session.root.children[0] as UIKitNativeViewNode;

    rendered.props.selectionStart = 1;
    rendered.props.selectionEnd = 3;
    input.props.selectionStart = 1;
    input.props.selectionEnd = 3;

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      inputType: "deleteByCut"
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      text: "Aha",
      value: "Aha",
      data: "",
      inputType: "deleteByCut",
      replacementRange: { start: 1, end: 3 },
      start: 1,
      end: 1,
      selectionStart: 1,
      selectionEnd: 1,
      selection: { start: 1, end: 1 },
      selectionRange: { start: 1, end: 1 }
    });
    expect(rendered.props.text).toBe("Aha");
    expect(rendered.props.selectionStart).toBe(1);
    expect(rendered.props.selectionEnd).toBe(1);
    expect(input.props.text).toBe("Aha");
  });
});