import type { RendererHost } from "@terajs/renderer";

import type {
  UIKitBridgeElementNode,
  UIKitBridgeFragmentNode,
  UIKitBridgeNode,
  UIKitBridgeTextNode,
} from "./bridgeNodes.js";

export type UIKitBridgeCommand =
  | {
    type: "create-element";
    nodeId: number;
    viewType: string;
    svg: boolean;
  }
  | {
    type: "create-text";
    nodeId: number;
    value: string;
  }
  | {
    type: "insert";
    parentId: number;
    childId: number;
    anchorId: number | null;
  }
  | {
    type: "remove";
    nodeId: number;
  }
  | {
    type: "set-text";
    nodeId: number;
    value: string;
  }
  | {
    type: "set-prop";
    nodeId: number;
    name: string;
    value: unknown;
  }
  | {
    type: "set-style";
    nodeId: number;
    style: Record<string, string>;
  }
  | {
    type: "set-class";
    nodeId: number;
    className: string;
  }
  | {
    type: "subscribe-event";
    nodeId: number;
    name: string;
  }
  | {
    type: "unsubscribe-event";
    nodeId: number;
    name: string;
  };

export interface CreateUIKitCommandBridgeOptions {
  emitCommand?: (command: UIKitBridgeCommand) => void;
  rootViewType?: string;
}

/** Packet shape a native host can send back toward the JS-owned renderer. */
export interface UIKitNativeEventPacket {
  nodeId: number;
  name: string;
  payload?: unknown;
}

export interface UIKitCommandBridge {
  readonly commands: UIKitBridgeCommand[];
  dispatchEvent(node: UIKitBridgeElementNode, name: string, payload?: unknown): void;
  drainCommands(): UIKitBridgeCommand[];
  getNode(nodeId: number): UIKitBridgeNode | undefined;
  host: RendererHost<
    UIKitBridgeNode,
    UIKitBridgeElementNode,
    UIKitBridgeTextNode,
    UIKitBridgeFragmentNode
  >;
  root: UIKitBridgeElementNode;
}