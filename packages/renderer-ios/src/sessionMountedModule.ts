import type { UIKitCommandBridge, UIKitBridgeNode } from "./bridge.js";
import type { UIKitMountedModule } from "./sessionContracts.js";

function getUIKitRemovalPriority(node: UIKitBridgeNode): number {
  return node.kind === "anchor" ? 0 : 1;
}

function removeUIKitBridgeNodes(bridge: UIKitCommandBridge, nodes: readonly UIKitBridgeNode[]): void {
  const orderedNodes = [...nodes].sort((left, right) => getUIKitRemovalPriority(left) - getUIKitRemovalPriority(right));

  for (const node of orderedNodes) {
    if (!bridge.getNode(node.id)) {
      continue;
    }

    bridge.host.remove(node);
  }
}

export function createUIKitMountedModule(
  bridge: UIKitCommandBridge,
  nodes: readonly UIKitBridgeNode[]
): UIKitMountedModule {
  let removed = false;

  return {
    bridgeNodes: [...nodes],
    remove() {
      if (removed) {
        return;
      }

      removed = true;
      removeUIKitBridgeNodes(bridge, nodes);
    }
  };
}