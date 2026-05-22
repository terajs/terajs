import type { UIKitBridgeNode } from "./bridgeNodes.js";
import {
  type CreateUIKitCommandBridgeOptions,
  type UIKitBridgeCommand,
  type UIKitCommandBridge,
} from "./bridgeContracts.js";
import { createUIKitBridgeHost } from "./bridgeHost.js";

export type {
  CreateUIKitCommandBridgeOptions,
  UIKitBridgeCommand,
  UIKitCommandBridge,
} from "./bridgeContracts.js";
export type {
  UIKitBridgeAnchorNode,
  UIKitBridgeElementNode,
  UIKitBridgeFragmentNode,
  UIKitBridgeNode,
  UIKitBridgeTextNode,
} from "./bridgeNodes.js";

/**
 * Creates a thin command-oriented UIKit bridge that keeps renderer ownership in JS
 * and emits only host operations plus event subscription state toward native.
 */
export function createUIKitCommandBridge(
  options: CreateUIKitCommandBridgeOptions = {}
): UIKitCommandBridge {
  const commands: UIKitBridgeCommand[] = [];
  const emitCommand = options.emitCommand;
  const nodes = new Map<number, UIKitBridgeNode>();

  function pushCommand(command: UIKitBridgeCommand): void {
    commands.push(command);
    emitCommand?.(command);
  }

  const { host, root } = createUIKitBridgeHost({
    nodes,
    pushCommand,
    rootViewType: options.rootViewType
  });

  return {
    commands,
    dispatchEvent(node, name, payload) {
      for (const handler of [...(node.eventHandlers[name] ?? [])]) {
        handler(payload);
      }
    },
    getNode(nodeId) {
      return nodes.get(nodeId);
    },
    host,
    root
  };
}