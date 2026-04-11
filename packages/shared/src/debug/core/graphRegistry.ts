import type { DependencyNode } from "../types/graph.js";

/**
 * In‑memory dependency graph registry.
 * Keyed by reactive identity (RID).
 */
const nodes = new Map<string, DependencyNode>();

/**
 * Ensure a node exists for the given RID.
 */
export function getOrCreateNode(rid: string): DependencyNode {
  let node = nodes.get(rid);
  if (!node) {
    node = {
      rid,
      dependsOn: new Set<string>(),
      dependents: new Set<string>()
    };
    nodes.set(rid, node);
  }
  return node;
}

/**
 * Get a node if it exists.
 */
export function getNode(rid: string): DependencyNode | undefined {
  return nodes.get(rid);
}

/**
 * Add a dependency edge: from → to
 * Meaning: `from` depends on `to`.
 */
export function addDependency(fromRid: string, toRid: string): void {
  // Prevent self-referential cycles
  if (fromRid === toRid) return;

  const from = getOrCreateNode(fromRid);
  const to = getOrCreateNode(toRid);

  from.dependsOn.add(toRid);
  to.dependents.add(fromRid);
}

/**
 * Remove a node and all edges connected to it.
 */
export function removeNode(rid: string): void {
  const node = nodes.get(rid);
  if (!node) return;

  // Remove this node from its dependencies' dependents
  for (const depRid of node.dependsOn) {
    const dep = nodes.get(depRid);
    if (dep) {
      dep.dependents.delete(rid);
    }
  }

  // Remove this node from its dependents' dependsOn
  for (const depRid of node.dependents) {
    const dep = nodes.get(depRid);
    if (dep) {
      dep.dependents.delete(rid);
    }
  }

  nodes.delete(rid);
}

/**
 * Get a shallow snapshot of the current graph.
 * Useful for devtools / inspection.
 */
export function getGraphSnapshot(): DependencyNode[] {
  return Array.from(nodes.values()).map((node) => ({
    rid: node.rid,
    dependsOn: new Set(node.dependsOn),
    dependents: new Set(node.dependents)
  }));
}

export function resetDebugGraphRegistry(): void {
  nodes.clear();
}