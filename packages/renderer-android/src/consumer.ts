import type { AndroidBridgeCommand } from "./bridgeContracts.js";
import type { AndroidCommandConsumer } from "./consumerContracts.js";
import {
  createAndroidNativeTextNode,
  createAndroidNativeViewNode,
  disposeAndroidNativeNode,
  insertAndroidNativeChild,
  requireAndroidNativeNode,
  requireAndroidNativeText,
  requireAndroidNativeView,
  type AndroidNativeNode,
  type AndroidNativeTextNode,
  type AndroidNativeViewNode,
} from "./consumerNodes.js";

export type { AndroidCommandConsumer } from "./consumerContracts.js";
export type {
  AndroidNativeNode,
  AndroidNativeTextNode,
  AndroidNativeViewNode,
} from "./consumerNodes.js";

/**
 * Replays thin Android bridge commands into an Android Views-shaped native tree
 * owned by the package-local consumer proof rather than the shared renderer.
 */
export function createAndroidCommandConsumer(): AndroidCommandConsumer {
  const nodes = new Map<number, AndroidNativeNode>();
  let root: AndroidNativeViewNode | null = null;

  function clearRoot(nodeId: number): void {
    if (root?.id === nodeId) {
      root = null;
    }
  }

  function applyCommand(command: AndroidBridgeCommand): void {
    switch (command.type) {
      case "create-element": {
        const node = createAndroidNativeViewNode(command.nodeId, command.viewType);

        nodes.set(node.id, node);
        root ??= node;
        return;
      }
      case "create-text": {
        const node = createAndroidNativeTextNode(command.nodeId, command.value);

        nodes.set(node.id, node);
        return;
      }
      case "insert": {
        insertAndroidNativeChild(
          requireAndroidNativeView(nodes, command.parentId),
          requireAndroidNativeNode(nodes, command.childId),
          command.anchorId
        );
        return;
      }
      case "remove": {
        disposeAndroidNativeNode(requireAndroidNativeNode(nodes, command.nodeId), nodes, clearRoot);
        return;
      }
      case "set-text": {
        requireAndroidNativeText(nodes, command.nodeId).value = command.value;
        return;
      }
      case "set-prop": {
        const node = requireAndroidNativeView(nodes, command.nodeId);
        if (command.value == null) {
          delete node.props[command.name];
        } else {
          node.props[command.name] = command.value;
        }
        return;
      }
      case "set-style": {
        const node = requireAndroidNativeView(nodes, command.nodeId);
        node.styles = {
          ...node.styles,
          ...command.style
        };
        return;
      }
      case "set-class": {
        requireAndroidNativeView(nodes, command.nodeId).className = command.className;
        return;
      }
      case "subscribe-event": {
        const node = requireAndroidNativeView(nodes, command.nodeId);
        if (!node.subscribedEvents.includes(command.name)) {
          node.subscribedEvents.push(command.name);
        }
        return;
      }
      case "unsubscribe-event": {
        const node = requireAndroidNativeView(nodes, command.nodeId);
        node.subscribedEvents = node.subscribedEvents.filter((name) => name !== command.name);
        return;
      }
      default: {
        const exhaustive: never = command;
        throw new Error(`Unhandled Android bridge command ${(exhaustive as { type: string }).type}`);
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