import { describe, expect, it, vi } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import {
  createUIKitWireTransport,
  parseUIKitBridgeCommands,
  stringifyUIKitNativeEventPacket,
  type UIKitBridgeElementNode,
} from "./index.js";

describe("renderer-ios wire transport", () => {
  it("drains bridge commands as encoded UIKit wire payloads", () => {
    const transport = createUIKitWireTransport();

    expect(parseUIKitBridgeCommands(transport.drainCommandBatchPayload()!)).toEqual([
      {
        type: "create-element",
        nodeId: transport.session.bridge.root.id,
        viewType: "UIView",
        svg: false
      }
    ]);
    expect(transport.drainCommandBatchPayload()).toBeNull();

    const label = transport.session.bridge.host.createElement("label");
    transport.session.bridge.host.insert(transport.session.bridge.root, label);

    expect(parseUIKitBridgeCommands(transport.drainCommandBatchPayload()!)).toEqual([
      {
        type: "create-element",
        nodeId: label.id,
        viewType: "UILabel",
        svg: false
      },
      {
        type: "insert",
        parentId: transport.session.bridge.root.id,
        childId: label.id,
        anchorId: null
      }
    ]);
  });

  it("dispatches encoded native event packet payloads through session ingress", () => {
    const transport = createUIKitWireTransport();
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

    const rendered = transport.session.mountIRNode(node, { value, onInput }) as UIKitBridgeElementNode;
    transport.drainCommandBatchPayload();

    transport.dispatchNativeEventPacketPayload(stringifyUIKitNativeEventPacket({
      nodeId: rendered.id,
      name: "textInput",
      payload: { value: "Beta" }
    }));

    expect(onInput).toHaveBeenCalledWith({ text: "Beta", value: "Beta" });
    expect(rendered.props.text).toBe("Beta");
  });
});