import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
  it("matches the committed Kotlin command conformance fixture", () => {
    const commands: AndroidBridgeCommand[] = [
      {
        type: "create-element",
        nodeId: 1,
        viewType: "LinearLayout",
        svg: false
      },
      {
        type: "create-element",
        nodeId: 2,
        viewType: "Button",
        svg: false
      },
      {
        type: "create-text",
        nodeId: 3,
        value: "Tap"
      },
      {
        type: "create-element",
        nodeId: 4,
        viewType: "TextView",
        svg: false
      },
      {
        type: "insert",
        parentId: 1,
        childId: 2,
        anchorId: null
      },
      {
        type: "insert",
        parentId: 1,
        childId: 4,
        anchorId: 2
      },
      {
        type: "insert",
        parentId: 2,
        childId: 3,
        anchorId: null
      },
      {
        type: "set-text",
        nodeId: 3,
        value: "Tap me"
      },
      {
        type: "set-prop",
        nodeId: 2,
        name: "contentDescription",
        value: {
          enabled: true,
          count: 2,
          range: {
            start: 1,
            end: 3
          },
          tags: ["native", null]
        }
      },
      {
        type: "set-prop",
        nodeId: 4,
        name: "hint",
        value: null
      },
      {
        type: "set-style",
        nodeId: 2,
        style: {
          textColor: "#1E88E5",
          padding: "8",
          layoutWidth: "match_parent"
        }
      },
      {
        type: "set-class",
        nodeId: 2,
        className: "primary-action"
      },
      {
        type: "subscribe-event",
        nodeId: 2,
        name: "press"
      },
      {
        type: "unsubscribe-event",
        nodeId: 2,
        name: "press"
      },
      {
        type: "remove",
        nodeId: 4
      }
    ];

    const fixture = readFileSync(
      resolve(process.cwd(), "packages/renderer-android/android/src/test/resources/ts-command-batch-conformance.json"),
      "utf8"
    );

    expect(parseAndroidBridgeCommands(fixture)).toEqual(commands);
    expect(JSON.parse(stringifyAndroidBridgeCommands(commands))).toEqual(JSON.parse(fixture));
  });

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