import type { AndroidBridgeCommand } from "./bridge.js";

type AndroidNativeNodeBase = {
  id: number;
  parent: AndroidNativeViewNode | null;
};

export type AndroidNativeTextNode = AndroidNativeNodeBase & {
  kind: "text";
  value: string;
};

export type AndroidNativeViewNode = AndroidNativeNodeBase & {
  children: AndroidNativeNode[];
  className: string;
  kind: "view";
  props: Record<string, unknown>;
  styles: Record<string, string>;
  subscribedEvents: string[];
  viewType: string;
};

export type AndroidNativeNode = AndroidNativeTextNode | AndroidNativeViewNode;

export interface AndroidCommandConsumer {
  applyCommand(command: AndroidBridgeCommand): void;
  applyCommands(commands: readonly AndroidBridgeCommand[]): void;
  getNode(nodeId: number): AndroidNativeNode | undefined;
  root: AndroidNativeViewNode | null;
}

/**
 * Replays thin Android bridge commands into an Android Views-shaped native tree
 * owned by the package-local consumer proof rather than the shared renderer.
 */
export function createAndroidCommandConsumer(): AndroidCommandConsumer {
  const nodes = new Map<number, AndroidNativeNode>();
  let root: AndroidNativeViewNode | null = null;

  function requireNode(nodeId: number): AndroidNativeNode {
    const node = nodes.get(nodeId);
    if (!node) {
      throw new Error(`Unknown Android native node ${nodeId}`);
    }

    return node;
  }

  function requireView(nodeId: number): AndroidNativeViewNode {
    const node = requireNode(nodeId);
    if (node.kind !== "view") {
      throw new Error(`Expected Android view node ${nodeId}`);
    }

    return node;
  }

  function requireText(nodeId: number): AndroidNativeTextNode {
    const node = requireNode(nodeId);
    if (node.kind !== "text") {
      throw new Error(`Expected Android text node ${nodeId}`);
    }

    return node;
  }

  function detach(node: AndroidNativeNode): void {
    const parent = node.parent;
    if (!parent) {
      return;
    }

    const index = parent.children.indexOf(node);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }

    node.parent = null;
  }

  function disposeNode(node: AndroidNativeNode): void {
    if (node.kind === "view") {
      for (const child of [...node.children]) {
        disposeNode(child);
      }

      node.children.length = 0;
      node.subscribedEvents = [];
    }

    detach(node);
    nodes.delete(node.id);

    if (root?.id === node.id) {
      root = null;
    }
  }

  function insertChild(parent: AndroidNativeViewNode, child: AndroidNativeNode, anchorId: number | null): void {
    detach(child);

    if (anchorId != null) {
      const anchorIndex = parent.children.findIndex((candidate) => candidate.id === anchorId);
      if (anchorIndex !== -1) {
        parent.children.splice(anchorIndex, 0, child);
        child.parent = parent;
        return;
      }
    }

    parent.children.push(child);
    child.parent = parent;
  }

  function applyCommand(command: AndroidBridgeCommand): void {
    switch (command.type) {
      case "create-element": {
        const node: AndroidNativeViewNode = {
          id: command.nodeId,
          parent: null,
          kind: "view",
          viewType: command.viewType,
          className: "",
          children: [],
          props: {},
          styles: {},
          subscribedEvents: []
        };

        nodes.set(node.id, node);
        root ??= node;
        return;
      }
      case "create-text": {
        const node: AndroidNativeTextNode = {
          id: command.nodeId,
          parent: null,
          kind: "text",
          value: command.value
        };

        nodes.set(node.id, node);
        return;
      }
      case "insert": {
        insertChild(requireView(command.parentId), requireNode(command.childId), command.anchorId);
        return;
      }
      case "remove": {
        disposeNode(requireNode(command.nodeId));
        return;
      }
      case "set-text": {
        requireText(command.nodeId).value = command.value;
        return;
      }
      case "set-prop": {
        const node = requireView(command.nodeId);
        if (command.value == null) {
          delete node.props[command.name];
        } else {
          node.props[command.name] = command.value;
        }
        return;
      }
      case "set-style": {
        const node = requireView(command.nodeId);
        node.styles = {
          ...node.styles,
          ...command.style
        };
        return;
      }
      case "set-class": {
        requireView(command.nodeId).className = command.className;
        return;
      }
      case "subscribe-event": {
        const node = requireView(command.nodeId);
        if (!node.subscribedEvents.includes(command.name)) {
          node.subscribedEvents.push(command.name);
        }
        return;
      }
      case "unsubscribe-event": {
        const node = requireView(command.nodeId);
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