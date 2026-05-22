import type { RendererHost } from "@terajs/renderer";

import type {
  AndroidBridgeElementNode,
  AndroidBridgeFragmentNode,
  AndroidBridgeNode,
  AndroidBridgeTextNode,
} from "./bridgeNodes.js";

export type AndroidBridgeCommand =
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

export interface CreateAndroidCommandBridgeOptions {
  emitCommand?: (command: AndroidBridgeCommand) => void;
  rootViewType?: string;
}

/** Packet shape a native host can send back toward the JS-owned renderer. */
export interface AndroidNativeEventPacket {
  nodeId: number;
  name: string;
  payload?: unknown;
}

export interface AndroidCommandBridge {
  readonly commands: AndroidBridgeCommand[];
  dispatchEvent(node: AndroidBridgeElementNode, name: string, payload?: unknown): void;
  drainCommands(): AndroidBridgeCommand[];
  getNode(nodeId: number): AndroidBridgeNode | undefined;
  host: RendererHost<
    AndroidBridgeNode,
    AndroidBridgeElementNode,
    AndroidBridgeTextNode,
    AndroidBridgeFragmentNode
  >;
  root: AndroidBridgeElementNode;
}