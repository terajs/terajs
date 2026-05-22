import type { UIKitBridgeCommand } from "./bridgeContracts.js";
import type { UIKitNativeNode, UIKitNativeViewNode } from "./consumerNodes.js";

export interface UIKitCommandConsumer {
  applyCommand(command: UIKitBridgeCommand): void;
  applyCommands(commands: readonly UIKitBridgeCommand[]): void;
  getNode(nodeId: number): UIKitNativeNode | undefined;
  root: UIKitNativeViewNode | null;
}