import type { DependencyNode } from "./types/graph.js";
import {
  addDependency as addEdge,
  getNode,
  getGraphSnapshot,
  removeNode
} from "./core/graphRegistry.js";

/**
 * Public API for the dependency graph used by the rest of debug/core.
 * Re‑exports the underlying graph operations with stable names.
 */

/**
 * Register a dependency: fromRid → toRid
 * Meaning: `fromRid` depends on `toRid`.
 */
export function addDependency(fromRid: string, toRid: string): void {
  addEdge(fromRid, toRid);
}

/**
 * Remove a node and all its edges from the graph.
 */
export function removeDependencyNode(rid: string): void {
  removeNode(rid);
}

/**
 * Get a single node by RID.
 */
export function getDependencyNode(rid: string): DependencyNode | undefined {
  return getNode(rid);
}

/**
 * Get a snapshot of the entire dependency graph.
 */
export function getDependencyGraphSnapshot(): DependencyNode[] {
  return getGraphSnapshot();
}