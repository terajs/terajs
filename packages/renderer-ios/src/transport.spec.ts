import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createUIKitCommandBridge,
  createUIKitHostSession,
  type UIKitBridgeElementNode,
} from "./index.js";

describe("renderer-ios transport seam", () => {
  it("drains bridge commands incrementally for native transport batches", () => {
    const bridge = createUIKitCommandBridge();

    expect(bridge.drainCommands()).toEqual([
      {
        type: "create-element",
        nodeId: bridge.root.id,
        viewType: "UIView",
        svg: false
      }
    ]);
    expect(bridge.commands).toEqual([]);

    const button = bridge.host.createElement("button");
    bridge.host.insert(bridge.root, button);

    expect(bridge.drainCommands()).toEqual([
      {
        type: "create-element",
        nodeId: button.id,
        viewType: "UIButton",
        svg: false
      },
      {
        type: "insert",
        parentId: bridge.root.id,
        childId: button.id,
        anchorId: null
      }
    ]);
    expect(bridge.drainCommands()).toEqual([]);
  });

  it("dispatches native event packets by node id through ingress", () => {
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

    session.dispatchNativeEventPacket({
      nodeId: rendered.id,
      name: "textInput",
      payload: { value: "Beta" }
    });

    expect(onInput).toHaveBeenCalledWith({ text: "Beta", value: "Beta" });
    expect(rendered.props.text).toBe("Beta");
  });
});