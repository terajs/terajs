import { describe, expect, it } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import {
  createUIKitCommandBridge,
  createUIKitCommandConsumer,
  normalizeUIKitStyle,
  type UIKitBridgeElementNode,
  type UIKitNativeViewNode,
} from "./index.js";

describe("renderer-ios style normalization", () => {
  it("maps CSS-like layout styles to UIKit-facing style keys", () => {
    expect(normalizeUIKitStyle("UIStackView", {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      padding: "16px",
      marginTop: "4px",
      marginBottom: "8px",
      background: "tomato",
      color: "#fff"
    })).toEqual({
      layoutMode: "stack",
      stackAxis: "horizontal",
      stackDistribution: "equalSpacing",
      stackAlignment: "center",
      stackSpacing: "12",
      contentPadding: "16",
      layoutMarginTop: "4",
      layoutMarginBottom: "8",
      backgroundColor: "tomato",
      textColor: "#fff"
    });
  });

  it("normalizes style bindings through the UIKit bridge and consumer", async () => {
    const consumer = createUIKitCommandConsumer();
    const bridge = createUIKitCommandBridge({
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

    const rendered = renderer.renderIRNode(node, { styles }) as UIKitBridgeElementNode;
    bridge.host.insert(bridge.root, rendered);

    const nativeNode = (consumer.root as UIKitNativeViewNode).children[0] as UIKitNativeViewNode;
    expect(rendered.viewType).toBe("UIStackView");
    expect(rendered.styles).toMatchObject({
      layoutMode: "stack",
      stackAxis: "horizontal",
      stackSpacing: "12",
      backgroundColor: "tomato"
    });
    expect(nativeNode.styles).toMatchObject({
      layoutMode: "stack",
      stackAxis: "horizontal",
      stackSpacing: "12",
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
      stackAxis: "vertical",
      stackSpacing: "20",
      backgroundColor: "navy"
    });
  });
});
