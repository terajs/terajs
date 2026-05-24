import type { RendererHost } from "@terajs/renderer";
import type { AndroidBridgeCommand } from "./bridgeContracts.js";
import { type AndroidBridgeElementNode, type AndroidBridgeFragmentNode, type AndroidBridgeNode, type AndroidBridgeTextNode } from "./bridgeNodes.js";
interface CreateAndroidBridgeHostOptions {
    nodes: Map<number, AndroidBridgeNode>;
    pushCommand(command: AndroidBridgeCommand): void;
    rootViewType?: string;
}
export declare function createAndroidBridgeHost(options: CreateAndroidBridgeHostOptions): {
    host: RendererHost<AndroidBridgeNode, AndroidBridgeElementNode, AndroidBridgeTextNode, AndroidBridgeFragmentNode>;
    root: AndroidBridgeElementNode;
};
export {};
//# sourceMappingURL=bridgeHost.d.ts.map