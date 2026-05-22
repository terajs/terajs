import type { AndroidCommandBridge, AndroidBridgeNode } from "./bridge.js";
import type { AndroidMountedModule } from "./sessionContracts.js";

function getAndroidRemovalPriority(node: AndroidBridgeNode): number {
  return node.kind === "anchor" ? 0 : 1;
}

function removeAndroidBridgeNodes(bridge: AndroidCommandBridge, nodes: readonly AndroidBridgeNode[]): void {
  const orderedNodes = [...nodes].sort((left, right) => getAndroidRemovalPriority(left) - getAndroidRemovalPriority(right));

  for (const node of orderedNodes) {
    if (!bridge.getNode(node.id)) {
      continue;
    }

    bridge.host.remove(node);
  }
}

export function createAndroidMountedModule(
  bridge: AndroidCommandBridge,
  nodes: readonly AndroidBridgeNode[]
): AndroidMountedModule {
  let removed = false;

  return {
    bridgeNodes: [...nodes],
    remove() {
      if (removed) {
        return;
      }

      removed = true;
      removeAndroidBridgeNodes(bridge, nodes);
    }
  };
}