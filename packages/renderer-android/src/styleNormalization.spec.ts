import { describe, expect, it } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createAndroidCommandBridge,
  createAndroidCommandConsumer,
  normalizeAndroidStyle,
  type AndroidBridgeElementNode,
  type AndroidNativeViewNode,
} from "./index.js";

describe("renderer-android style normalization", () => {
  it("maps CSS-like layout styles to Android-facing style keys", () => {
    expect(normalizeAndroidStyle("LinearLayout", {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      padding: "16px",
      background: "tomato",
      color: "#fff"
    })).toEqual({
      layoutMode: "linear",
      orientation: "horizontal",
      gravity: "space_between",
      layoutGravity: "center",
      spacing: "12",
      padding: "16",
      backgroundColor: "tomato",
      textColor: "#fff"
    });
  });

  it("normalizes style bindings through the Android bridge and consumer", async () => {
    const consumer = createAndroidCommandConsumer();
    const bridge = createAndroidCommandBridge({
      emitCommand(command) {
        consumer.applyCommand(command);
      }
    });
    const renderer = createHostIRRenderer({
      host: bridge.host,
      bindings: createHostBindings(bridge.host)
    });

    const styles = signal<Record<string, string>>({
      display: "flex",
      flexDirection: "row",
      gap: "12px",
      background: "tomato"
    });
    const node: IRElementNode = {
      type: "element",
      tag: "stack",
      props: [
        {
          kind: "bind",
          name: "style",
          value: "styles",
          binding: {
            kind: "simple-path",
            segments: ["styles"]
          }
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const rendered = renderer.renderIRNode(node, { styles }) as AndroidBridgeElementNode;
    bridge.host.insert(bridge.root, rendered);

    const nativeNode = (consumer.root as AndroidNativeViewNode).children[0] as AndroidNativeViewNode;
    expect(rendered.viewType).toBe("LinearLayout");
    expect(rendered.styles).toMatchObject({
      layoutMode: "linear",
      orientation: "horizontal",
      spacing: "12",
      backgroundColor: "tomato"
    });
    expect(nativeNode.styles).toMatchObject({
      layoutMode: "linear",
      orientation: "horizontal",
      spacing: "12",
      backgroundColor: "tomato"
    });

    styles.set({
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      background: "navy"
    });
    await Promise.resolve();

    expect(nativeNode.styles).toMatchObject({
      orientation: "vertical",
      spacing: "20",
      backgroundColor: "navy"
    });
  });
});