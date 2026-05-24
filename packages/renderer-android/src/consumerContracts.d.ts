import type { AndroidBridgeCommand } from "./bridgeContracts.js";
import type { AndroidNativeNode, AndroidNativeViewNode } from "./consumerNodes.js";
export interface AndroidCommandConsumer {
    applyCommand(command: AndroidBridgeCommand): void;
    applyCommands(commands: readonly AndroidBridgeCommand[]): void;
    getNode(nodeId: number): AndroidNativeNode | undefined;
    root: AndroidNativeViewNode | null;
}
//# sourceMappingURL=consumerContracts.d.ts.map