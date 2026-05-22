import { describe, expect, it } from "vitest";

import {
  parseAndroidBridgeCommands,
  parseAndroidNativeEventPacket,
  stringifyAndroidBridgeCommands,
  stringifyAndroidNativeEventPacket,
  type AndroidBridgeCommand,
  type AndroidNativeEventPacket,
} from "./index.js";

describe("renderer-android transport codec", () => {
  it("round-trips JSON-safe bridge command batches", () => {
    const commands: AndroidBridgeCommand[] = [
      {
        type: "create-element",
        nodeId: 1,
        viewType: "Button",
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
        style: { textColor: "#1E88E5" }
      }
    ];

    expect(parseAndroidBridgeCommands(stringifyAndroidBridgeCommands(commands))).toEqual(commands);
  });

  it("round-trips native event packets through the wire codec", () => {
    const packet: AndroidNativeEventPacket = {
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

    expect(parseAndroidNativeEventPacket(stringifyAndroidNativeEventPacket(packet))).toEqual(packet);
  });

  it("rejects non-wire-safe bridge payloads", () => {
    expect(() => stringifyAndroidBridgeCommands([
      {
        type: "set-prop",
        nodeId: 1,
        name: "handler",
        value: () => null
      }
    ] as AndroidBridgeCommand[])).toThrow(/JSON-safe/);
  });
});