import { describe, expect, it } from "vitest";

import {
  parseUIKitBridgeCommands,
  parseUIKitNativeEventPacket,
  stringifyUIKitBridgeCommands,
  stringifyUIKitNativeEventPacket,
  type UIKitBridgeCommand,
  type UIKitNativeEventPacket,
} from "./index.js";

describe("renderer-ios transport codec", () => {
  it("round-trips JSON-safe bridge command batches", () => {
    const commands: UIKitBridgeCommand[] = [
      {
        type: "create-element",
        nodeId: 1,
        viewType: "UIButton",
        svg: false
      },
      {
        type: "set-prop",
        nodeId: 1,
        name: "selectionRange",
        value: { start: 2, end: 4, tags: ["ime", "native"] }
      },
      {
        type: "set-style",
        nodeId: 1,
        style: { textColor: "systemBlue" }
      }
    ];

    expect(parseUIKitBridgeCommands(stringifyUIKitBridgeCommands(commands))).toEqual(commands);
  });

  it("round-trips native event packets through the wire codec", () => {
    const packet: UIKitNativeEventPacket = {
      nodeId: 4,
      name: "beforeinput",
      payload: {
        inputType: "insertFromPaste",
        targetRange: [1, 3],
        clipboardData: {
          items: [{ type: "text/plain", data: "eta" }]
        }
      }
    };

    expect(parseUIKitNativeEventPacket(stringifyUIKitNativeEventPacket(packet))).toEqual(packet);
  });

  it("rejects non-wire-safe bridge payloads", () => {
    expect(() => stringifyUIKitBridgeCommands([
      {
        type: "set-prop",
        nodeId: 1,
        name: "handler",
        value: () => null
      }
    ] as UIKitBridgeCommand[])).toThrow(/JSON-safe/);
  });
});