import type { UIKitBridgeCommand } from "./bridgeContracts.js";
import type { UIKitCommandConsumer } from "./consumerContracts.js";
import {
  createUIKitNativeTextNode,
  createUIKitNativeViewNode,
  disposeUIKitNativeNode,
  insertUIKitNativeChild,
  requireUIKitNativeNode,
  requireUIKitNativeText,
  requireUIKitNativeView,
  type UIKitNativeNode,
  type UIKitNativeTextNode,
  type UIKitNativeViewNode,
} from "./consumerNodes.js";

export type { UIKitCommandConsumer } from "./consumerContracts.js";
export type {
  UIKitNativeNode,
  UIKitNativeTextNode,
  UIKitNativeViewNode,
} from "./consumerNodes.js";

/**
 * Replays thin UIKit bridge commands into a UIKit-shaped native tree owned by
 * the package-local consumer proof rather than the shared renderer.
 */
export function createUIKitCommandConsumer(): UIKitCommandConsumer {
  const nodes = new Map<number, UIKitNativeNode>();
  let root: UIKitNativeViewNode | null = null;

  function clearRoot(nodeId: number): void {
    if (root?.id === nodeId) {
      root = null;
    }
  }

  function applyCommand(command: UIKitBridgeCommand): void {
    switch (command.type) {
      case "create-element": {
        const node = createUIKitNativeViewNode(command.nodeId, command.viewType);

        nodes.set(node.id, node);
        root ??= node;
        return;
      }
      case "create-text": {
        const node = createUIKitNativeTextNode(command.nodeId, command.value);

        nodes.set(node.id, node);
        return;
      }
      case "insert": {
        insertUIKitNativeChild(
          requireUIKitNativeView(nodes, command.parentId),
          requireUIKitNativeNode(nodes, command.childId),
          command.anchorId
        );
        return;
      }
      case "remove": {
        disposeUIKitNativeNode(requireUIKitNativeNode(nodes, command.nodeId), nodes, clearRoot);
        return;
      }
      case "set-text": {
        requireUIKitNativeText(nodes, command.nodeId).value = command.value;
        return;
      }
      case "set-prop": {
        const node = requireUIKitNativeView(nodes, command.nodeId);
        if (command.value == null) {
          delete node.props[command.name];
        } else {
          node.props[command.name] = command.value;
        }
        return;
      }
      case "set-style": {
        const node = requireUIKitNativeView(nodes, command.nodeId);
        node.styles = {
          ...node.styles,
          ...command.style
        };
        return;
      }
      case "set-class": {
        requireUIKitNativeView(nodes, command.nodeId).className = command.className;
        return;
      }
      case "subscribe-event": {
        const node = requireUIKitNativeView(nodes, command.nodeId);
        if (!node.subscribedEvents.includes(command.name)) {
          node.subscribedEvents.push(command.name);
        }
        return;
      }
      case "unsubscribe-event": {
        const node = requireUIKitNativeView(nodes, command.nodeId);
        node.subscribedEvents = node.subscribedEvents.filter((name) => name !== command.name);
        return;
      }
      default: {
        const exhaustive: never = command;
        throw new Error(`Unhandled UIKit bridge command ${(exhaustive as { type: string }).type}`);
      }
    }
  }

  return {
    applyCommand,
    applyCommands(commands) {
      for (const command of commands) {
        applyCommand(command);
      }
    },
    getNode(nodeId) {
      return nodes.get(nodeId);
    },
    get root() {
      return root;
    }
  };
}