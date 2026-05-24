import type { IRModule, IRNode } from "@terajs/compiler";
import type { AndroidBridgeNode, AndroidCommandBridge, AndroidNativeEventPacket } from "./bridge.js";
import type { AndroidCommandConsumer, AndroidNativeNode, AndroidNativeViewNode } from "./consumer.js";
export interface AndroidMountedModule {
    bridgeNodes: readonly AndroidBridgeNode[];
    remove(): void;
}
export interface AndroidHostSession {
    bridge: AndroidCommandBridge;
    consumer: AndroidCommandConsumer;
    dispatchNativeEvent(nodeId: number, name: string, payload?: unknown): void;
    dispatchNativeEventPacket(packet: AndroidNativeEventPacket): void;
    getBridgeNode(nodeId: number): AndroidBridgeNode | undefined;
    getNativeNode(nodeId: number): AndroidNativeNode | undefined;
    mountIRModule(ir: IRModule, ctx: any): AndroidMountedModule;
    mountIRNode(node: IRNode, ctx: any, isSvg?: boolean): AndroidBridgeNode | null;
    removeNode(nodeId: number): void;
    root: AndroidNativeViewNode;
}
//# sourceMappingURL=sessionContracts.d.ts.map