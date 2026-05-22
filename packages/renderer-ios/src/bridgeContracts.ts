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

export interface UIKitCommandBridge {
  readonly commands: UIKitBridgeCommand[];
  dispatchEvent(node: UIKitBridgeElementNode, name: string, payload?: unknown): void;
  getNode(nodeId: number): UIKitBridgeNode | undefined;
  host: RendererHost<
    UIKitBridgeNode,
    UIKitBridgeElementNode,
    UIKitBridgeTextNode,
    UIKitBridgeFragmentNode
  >;
  root: UIKitBridgeElementNode;
}