import type { IRModule, IRNode } from "@terajs/compiler";

import type { UIKitBridgeNode, UIKitCommandBridge } from "./bridge.js";
import type { UIKitCommandConsumer, UIKitNativeNode, UIKitNativeViewNode } from "./consumer.js";

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