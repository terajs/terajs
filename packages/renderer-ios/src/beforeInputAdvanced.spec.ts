import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createUIKitHostSession,
  type UIKitBridgeElementNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios advanced beforeinput ingress", () => {
  it("infers delete previews from collapsed caret state when the payload omits replacement text", () => {
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

    rendered.props.selectionStart = 3;
    rendered.props.selectionEnd = 3;
    input.props.selectionStart = 3;
    input.props.selectionEnd = 3;

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      inputType: "deleteContentBackward"
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      text: "Alha",
      value: "Alha",
      data: "",
      inputType: "deleteContentBackward",
      replacementRange: { start: 2, end: 3 },
      start: 2,
      end: 2,
      selectionStart: 2,
      selectionEnd: 2,
      selection: { start: 2, end: 2 },
      selectionRange: { start: 2, end: 2 }
    });
    expect(rendered.props.text).toBe("Alha");
    expect(rendered.props.selectionStart).toBe(2);
    expect(rendered.props.selectionEnd).toBe(2);
    expect(input.props.text).toBe("Alha");
  });

  it("infers forward-delete previews from collapsed caret state", () => {
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

    rendered.props.selectionStart = 2;
    rendered.props.selectionEnd = 2;
    input.props.selectionStart = 2;
    input.props.selectionEnd = 2;

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      inputType: "deleteContentForward"
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      text: "Alha",
      value: "Alha",
      data: "",
      inputType: "deleteContentForward",
      replacementRange: { start: 2, end: 3 },
      start: 2,
      end: 2,
      selectionStart: 2,
      selectionEnd: 2,
      selection: { start: 2, end: 2 },
      selectionRange: { start: 2, end: 2 }
    });
    expect(rendered.props.text).toBe("Alha");
    expect(rendered.props.selectionStart).toBe(2);
    expect(rendered.props.selectionEnd).toBe(2);
    expect(input.props.text).toBe("Alha");
  });

  it("supports replaceRange aliases with rangeStart and rangeEnd coordinates", () => {
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

    rendered.props.selectionStart = 5;
    rendered.props.selectionEnd = 5;
    input.props.selectionStart = 5;
    input.props.selectionEnd = 5;

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      data: "eta",
      inputType: "insertReplacementText",
      replaceRange: { rangeStart: 1, rangeEnd: 3 }
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      text: "Aetaha",
      value: "Aetaha",
      data: "eta",
      inputType: "insertReplacementText",
      replaceRange: { rangeStart: 1, rangeEnd: 3 },
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

  it("supports range aliases with location and length coordinates", () => {
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

    rendered.props.selectionStart = 5;
    rendered.props.selectionEnd = 5;
    input.props.selectionStart = 5;
    input.props.selectionEnd = 5;

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      insertedText: "eta",
      inputType: "insertReplacementText",
      range: { location: 1, length: 2 }
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      text: "Aetaha",
      value: "Aetaha",
      data: "eta",
      insertedText: "eta",
      inputType: "insertReplacementText",
      range: { location: 1, length: 2 },
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

  it("supports multiline textarea previews from targetRanges aliases", () => {
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
      insertedText: "Beta\nDelta",
      inputType: "insertReplacementText",
      targetRanges: [{ startOffset: 6, endOffset: 11 }]
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      text: "Alpha\nBeta\nDelta\nCharlie",
      value: "Alpha\nBeta\nDelta\nCharlie",
      data: "Beta\nDelta",
      insertedText: "Beta\nDelta",
      inputType: "insertReplacementText",
      replacementRange: { start: 6, end: 11 },
      targetRanges: [{ startOffset: 6, endOffset: 11 }],
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
});