import type { AndroidBridgeNode } from "./bridgeNodes.js";
import {
  type AndroidBridgeCommand,
  type AndroidCommandBridge,
  type CreateAndroidCommandBridgeOptions,
  type AndroidNativeEventPacket,
} from "./bridgeContracts.js";
import { createAndroidBridgeHost } from "./bridgeHost.js";

export type {
  AndroidBridgeCommand,
  AndroidCommandBridge,
  CreateAndroidCommandBridgeOptions,
  AndroidNativeEventPacket,
} from "./bridgeContracts.js";
export type {
  AndroidBridgeAnchorNode,
  AndroidBridgeElementNode,
  AndroidBridgeFragmentNode,
  AndroidBridgeNode,
  AndroidBridgeTextNode,
} from "./bridgeNodes.js";

/**
 * Creates a thin command-oriented Android bridge that keeps renderer ownership in JS
 * and emits only host operations plus event subscription state toward native.
 */
export function createAndroidCommandBridge(
  options: CreateAndroidCommandBridgeOptions = {}
): AndroidCommandBridge {
  const commands: AndroidBridgeCommand[] = [];
  const emitCommand = options.emitCommand;
  const nodes = new Map<number, AndroidBridgeNode>();

  function pushCommand(command: AndroidBridgeCommand): void {
    commands.push(command);
    emitCommand?.(command);
  }

  const { host, root } = createAndroidBridgeHost({
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
    drainCommands() {
      const drained = [...commands];
      commands.length = 0;
      return drained;
    },
    getNode(nodeId) {
      return nodes.get(nodeId);
    },
    host,
    root
  };
}