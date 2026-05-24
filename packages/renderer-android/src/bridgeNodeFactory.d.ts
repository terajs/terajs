import type { AndroidBridgeCommand } from "./bridgeContracts.js";
import { type AndroidBridgeAnchorNode, type AndroidBridgeElementNode, type AndroidBridgeFragmentNode, type AndroidBridgeNode, type AndroidBridgeTextNode } from "./bridgeNodes.js";
interface CreateAndroidBridgeNodeFactoryOptions {
    nodes: Map<number, AndroidBridgeNode>;
    pushCommand(command: AndroidBridgeCommand): void;
}
export declare function createAndroidBridgeNodeFactory(options: CreateAndroidBridgeNodeFactoryOptions): {
    createAnchorNode(label?: string): AndroidBridgeAnchorNode;
    createElementNode(viewType: string, svg: boolean): AndroidBridgeElementNode;
    createFragmentNode(): AndroidBridgeFragmentNode;
    createTextNode(value: string): AndroidBridgeTextNode;
};
export {};
//# sourceMappingURL=bridgeNodeFactory.d.ts.map