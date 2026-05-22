import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createAndroidHostSession,
  type AndroidBridgeElementNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android advanced composition ingress", () => {
  it("derives multiline composition previews from targetRanges when the payload omits the final value", () => {
    const session = createAndroidHostSession();
    const value = signal("Alpha\nBravo\nCharlie");
    const onCompositionUpdate = vi.fn();
    const onCompositionEnd = vi.fn();
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
          name: "compositionUpdate",
          value: "onCompositionUpdate"
        },
        {
          kind: "event",
          name: "compositionEnd",
          value: "onCompositionEnd"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, onCompositionUpdate, onCompositionEnd }) as AndroidBridgeElementNode;
    const input = session.root.children[0] as AndroidNativeViewNode;

    session.dispatchNativeEvent(rendered.id, "compositionupdate", {
      data: "Beta\nDelta",
      targetRanges: [{ startOffset: 6, endOffset: 11 }]
    });

    expect(onCompositionUpdate).toHaveBeenCalledWith({
      text: "Alpha\nBeta\nDelta\nCharlie",
      value: "Alpha\nBeta\nDelta\nCharlie",
      data: "Beta\nDelta",
      composition: "Beta\nDelta",
      targetRanges: [{ startOffset: 6, endOffset: 11 }],
      replacementRange: { start: 6, end: 11 },
      composing: true,
      isComposing: true,
      start: 16,
      end: 16,
      selectionStart: 16,
      selectionEnd: 16,
      selection: { start: 16, end: 16 },
      selectionRange: { start: 16, end: 16 }
    });
    expect(rendered.props.text).toBe("Alpha\nBeta\nDelta\nCharlie");
    expect(rendered.props.selectionStart).toBe(16);
    expect(rendered.props.selectionEnd).toBe(16);
    expect(rendered.props.composing).toBe(true);
    expect(rendered.props.compositionText).toBe("Beta\nDelta");
    expect(input.props.text).toBe("Alpha\nBeta\nDelta\nCharlie");
    expect(input.props.selectionStart).toBe(16);
    expect(input.props.selectionEnd).toBe(16);

    session.dispatchNativeEvent(rendered.id, "compositionend", {
      data: "Beta\nDelta",
      targetRanges: [{ startOffset: 6, endOffset: 11 }]
    });

    expect(onCompositionEnd).toHaveBeenCalledWith({
      text: "Alpha\nBeta\nDelta\nCharlie",
      value: "Alpha\nBeta\nDelta\nCharlie",
      data: "Beta\nDelta",
      composition: "Beta\nDelta",
      targetRanges: [{ startOffset: 6, endOffset: 11 }],
      replacementRange: { start: 6, end: 11 },
      composing: false,
      isComposing: false,
      start: 16,
      end: 16,
      selectionStart: 16,
      selectionEnd: 16,
      selection: { start: 16, end: 16 },
      selectionRange: { start: 16, end: 16 }
    });
    expect(rendered.props.composing).toBe(false);
    expect(rendered.props.compositionText).toBeUndefined();
    expect(input.props.composing).toBe(false);
    expect(input.props.compositionText).toBeUndefined();
  });

  it("applies text limits to derived composition previews and clamps selection", () => {
    const session = createAndroidHostSession();
    const value = signal("Alpha");
    const maxLength = signal(4);
    const onCompositionUpdate = vi.fn();
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
          kind: "bind",
          name: "maxLength",
          value: "maxLength",
          binding: {
            kind: "simple-path",
            segments: ["maxLength"]
          }
        },
        {
          kind: "event",
          name: "compositionUpdate",
          value: "onCompositionUpdate"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, maxLength, onCompositionUpdate }) as AndroidBridgeElementNode;
    const input = session.root.children[0] as AndroidNativeViewNode;

    session.dispatchNativeEvent(rendered.id, "compositionupdate", {
      data: "BetaGamma",
      targetRange: [1, 5]
    });

    expect(onCompositionUpdate).toHaveBeenCalledWith({
      text: "ABet",
      value: "ABet",
      data: "Beta",
      composition: "Beta",
      targetRange: [1, 5],
      replacementRange: { start: 1, end: 5 },
      composing: true,
      isComposing: true,
      start: 4,
      end: 4,
      selectionStart: 4,
      selectionEnd: 4,
      selection: { start: 4, end: 4 },
      selectionRange: { start: 4, end: 4 }
    });
    expect(rendered.props.text).toBe("ABet");
    expect(rendered.props.selectionStart).toBe(4);
    expect(rendered.props.selectionEnd).toBe(4);
    expect(rendered.props.compositionText).toBe("Beta");
    expect(input.props.text).toBe("ABet");
    expect(input.props.selectionStart).toBe(4);
    expect(input.props.selectionEnd).toBe(4);
  });
});