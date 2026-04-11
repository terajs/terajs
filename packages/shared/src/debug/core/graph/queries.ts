/**
 * @file queries.ts
 * @description
 * High‑level graph query utilities for Terajs’s dependency graph.
 *
 * These functions provide read‑only access to the graph structure and are
 * intended for DevTools, debugging, and visualization.
 */

import { getDependencyNode } from "../../dependencyGraph.js";

/**
 * Returns all RIDs that the given node depends on.
 *
 * @param rid - The reactive identity to inspect.
 */
export function getDependencies(rid: string): string[] {
  const node = getDependencyNode(rid);
  return node ? Array.from(node.dependsOn) : [];
}

/**
 * Returns all RIDs that depend on the given node.
 *
 * @param rid - The reactive identity to inspect.
 */
export function getDependents(rid: string): string[] {
  const node = getDependencyNode(rid);
  return node ? Array.from(node.dependents) : [];
}

/**
 * Performs a full upward traversal of the dependency graph.
 *
 * Useful for answering: “If this node updates, what will be affected?”
 *
 * @param rid - The starting reactive identity.
 * @returns A list of all reachable dependents.
 */
export function traceUpdate(rid: string): string[] {
  const visited = new Set<string>();
  const stack = [rid];

  while (stack.length) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = getDependencyNode(current);
    if (!node) continue;

    for (const dep of node.dependents) {
      stack.push(dep);
    }
  }

  return Array.from(visited);
}
