/**
 * @file devtoolsBridge.ts
 * @description
 * Public interface between Terajs DevTools and the internal debug core.
 *
 * This module exposes safe, read‑only access to:
 * - the dependency graph
 * - graph queries (dependencies, dependents, update tracing)
 *
 * DevTools should import ONLY from this bridge, never from internal files.
 */

import {
  getDependencyGraphSnapshot,
  getDependencyNode
} from "./dependencyGraph.js";

import {
  getDependencies,
  getDependents,
  traceUpdate
} from "./core/graph/queries.js";

export const DevtoolsBridge = {
  /**
   * Returns a full snapshot of the dependency graph.
   * Useful for visual graph renderers.
   */
  getGraph() {
    return getDependencyGraphSnapshot();
  },

  /**
   * Returns a single node by RID.
   */
  getNode(rid: string) {
    return getDependencyNode(rid);
  },

  /**
   * Returns all nodes this RID depends on.
   */
  getDependencies,

  /**
   * Returns all nodes that depend on this RID.
   */
  getDependents,

  /**
   * Returns all nodes that would be affected if this RID updates.
   */
  traceUpdate
};
