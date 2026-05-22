import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createAndroidHostSession,
  type AndroidBridgeElementNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android beforeinput ingress", () => {
  it("normalizes beforeinput payloads into preview text and replacement range state", () => {
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

    rendered.props.selectionStart = 1;
    rendered.props.selectionEnd = 3;
    input.props.selectionStart = 1;
    input.props.selectionEnd = 3;

    expect(input.subscribedEvents).toEqual(["beforeinput"]);

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      data: "eta",
      inputType: "insertReplacementText",
      replacementRange: [1, 3]
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      text: "Aetaha",
      value: "Aetaha",
      data: "eta",
      inputType: "insertReplacementText",
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
    expect(input.props.selectionStart).toBe(4);
    expect(input.props.selectionEnd).toBe(4);
  });

  it("applies text limits to beforeinput previews before syncing native state", () => {
    const session = createAndroidHostSession();
    const value = signal("Alpha");
    const maxLength = signal(4);
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
          name: "beforeInput",
          value: "onBeforeInput"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = session.mountIRNode(node, { value, maxLength, onBeforeInput }) as AndroidBridgeElementNode;
    const input = session.root.children[0] as AndroidNativeViewNode;

    rendered.props.selectionStart = 2;
    rendered.props.selectionEnd = 5;
    input.props.selectionStart = 2;
    input.props.selectionEnd = 5;

    session.dispatchNativeEvent(rendered.id, "beforeinput", {
      data: "etaGamma",
      replacementRange: [2, 5]
    });

    expect(onBeforeInput).toHaveBeenCalledWith({
      text: "Alet",
      value: "Alet",
      data: "etaGamma",
      inputType: "insertText",
      replacementRange: { start: 2, end: 5 },
      start: 4,
      end: 4,
      selectionStart: 4,
      selectionEnd: 4,
      selection: { start: 4, end: 4 },
      selectionRange: { start: 4, end: 4 }
    });
    expect(rendered.props.text).toBe("Alet");
    expect(rendered.props.selectionStart).toBe(4);
    expect(rendered.props.selectionEnd).toBe(4);
    expect(input.props.text).toBe("Alet");
    expect(input.props.selectionStart).toBe(4);
    expect(input.props.selectionEnd).toBe(4);
  });
});