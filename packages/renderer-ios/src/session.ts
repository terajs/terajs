import type { IRModule, IRNode } from "@terajs/compiler";
import { createHostBindings, createHostIRRenderer } from "@terajs/renderer";

import {
  createUIKitCommandBridge,
  type UIKitBridgeElementNode,
  type UIKitBridgeNode,
  type UIKitCommandBridge,
} from "./bridge.js";
import {
  createUIKitCommandConsumer,
  type UIKitCommandConsumer,
  type UIKitNativeNode,
  type UIKitNativeViewNode,
} from "./consumer.js";

export interface UIKitMountedModule {
  bridgeNodes: readonly UIKitBridgeNode[];
  remove(): void;
}

export interface UIKitHostSession {
  bridge: UIKitCommandBridge;
  consumer: UIKitCommandConsumer;
  dispatchNativeEvent(nodeId: number, name: string, payload?: unknown): void;
  getBridgeNode(nodeId: number): UIKitBridgeNode | undefined;
  getNativeNode(nodeId: number): UIKitNativeNode | undefined;
  mountIRModule(ir: IRModule, ctx: any): UIKitMountedModule;
  mountIRNode(node: IRNode, ctx: any, isSvg?: boolean): UIKitBridgeNode | null;
  removeNode(nodeId: number): void;
  root: UIKitNativeViewNode;
}

/**
 * Creates a package-local UIKit host session that mounts compiler IR through the
 * neutral host renderer runtime and replays the resulting command stream into the
 * UIKit-shaped native tree owned by this package.
 */
export function createUIKitHostSession(): UIKitHostSession {
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

  function requireRoot(): UIKitNativeViewNode {
    const root = consumer.root;
    if (!root) {
      throw new Error("UIKit host session root was not initialized");
    }

    return root;
  }

  function removeBridgeNodes(nodes: readonly UIKitBridgeNode[]): void {
    const orderedNodes = [...nodes].sort((left, right) => getRemovalPriority(left) - getRemovalPriority(right));

    for (const node of orderedNodes) {
      if (!bridge.getNode(node.id)) {
        continue;
      }

      bridge.host.remove(node);
    }
  }

  function createMountedModule(nodes: readonly UIKitBridgeNode[]): UIKitMountedModule {
    let removed = false;

    return {
      bridgeNodes: [...nodes],
      remove() {
        if (removed) {
          return;
        }

        removed = true;
        removeBridgeNodes(nodes);
      }
    };
  }

  return {
    bridge,
    consumer,
    dispatchNativeEvent(nodeId, name, payload) {
      const node = bridge.getNode(nodeId);
      if (!node || node.kind !== "element") {
        throw new Error(`Cannot dispatch UIKit native event for node ${nodeId}`);
      }

      bridge.dispatchEvent(node as UIKitBridgeElementNode, name, payload);
    },
    getBridgeNode(nodeId) {
      return bridge.getNode(nodeId);
    },
    getNativeNode(nodeId) {
      return consumer.getNode(nodeId);
    },
    mountIRModule(ir, ctx) {
      const rendered = renderer.renderIRModule(ir, ctx);
      const bridgeNodes = bridge.host.getChildren(rendered);
      bridge.host.insert(bridge.root, rendered);
      return createMountedModule(bridgeNodes);
    },
    mountIRNode(node, ctx, isSvg = false) {
      const rendered = renderer.renderIRNode(node, ctx, isSvg);
      if (rendered) {
        bridge.host.insert(bridge.root, rendered);
      }
      return rendered;
    },
    removeNode(nodeId) {
      const node = bridge.getNode(nodeId);
      if (!node || node.id === bridge.root.id) {
        return;
      }

      bridge.host.remove(node);
    },
    get root() {
      return requireRoot();
    }
  };
}

function getRemovalPriority(node: UIKitBridgeNode): number {
  return node.kind === "anchor" ? 0 : 1;
}