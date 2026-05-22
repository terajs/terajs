import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createAndroidHostSession,
  type AndroidBridgeElementNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android advanced beforeinput ingress", () => {
  it("infers delete previews from collapsed caret state when the payload omits replacement text", () => {
    const session = createAndroidHostSession();
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

    const rendered = session.mountIRNode(node, { value, onBeforeInput }) as AndroidBridgeElementNode;
    const input = session.root.children[0] as AndroidNativeViewNode;

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

  it("supports multiline textarea previews from targetRanges aliases", () => {
    const session = createAndroidHostSession();
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

    const rendered = session.mountIRNode(node, { value, onBeforeInput }) as AndroidBridgeElementNode;
    const input = session.root.children[0] as AndroidNativeViewNode;

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
    expect(input.viewType).toBe("EditText");
    expect(rendered.props.text).toBe("Alpha\nBeta\nDelta\nCharlie");
    expect(rendered.props.selectionStart).toBe(16);
    expect(rendered.props.selectionEnd).toBe(16);
    expect(input.props.text).toBe("Alpha\nBeta\nDelta\nCharlie");
  });
});