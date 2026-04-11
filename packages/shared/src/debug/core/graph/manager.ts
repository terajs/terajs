/**
 * @file manager.ts
 * @description
 * Reactive Graph Manager for Terajs.
 */

import type { ReactiveMetadata } from "../../types/metadata.js";
import type { DebugEvent } from "../../types/events.js";
import type { DependencyNode } from "../../types/graph.js";

import {
  getDependencyNode,
  getDependencyGraphSnapshot,
  removeDependencyNode
} from "../../dependencyGraph.js";

import { subscribeDebug } from "../../eventBus.js";

/**
 * High‑level classification of nodes in the reactive graph.
 */
export type GraphNodeKind =
  | "signal"
  | "computed"
  | "effect"
  | "component"
  | "dom"
  | "route";

/**
 * Extended node info for DevTools / introspection.
 * This wraps the low‑level DependencyNode with semantic meaning.
 */
export interface GraphNodeInfo {
  rid: string;
  kind: GraphNodeKind;
  meta?: ReactiveMetadata;
  scope?: string;
  instance?: number;
  domNodeId?: string;
}

const nodes = new Map<string, GraphNodeInfo>();

function kindFromMeta(meta: ReactiveMetadata): GraphNodeKind {
  switch (meta.type) {
    case "ref":
      return "signal";
    case "computed":
      return "computed";
    case "effect":
      return "effect";
    default:
      return "signal";
  }
}

function componentRid(scope: string, instance: number): string {
  return `${scope}#${instance}`;
}

function upsertNode(info: GraphNodeInfo): void {
  const existing = nodes.get(info.rid);
  if (existing) {
    nodes.set(info.rid, { ...existing, ...info });
  } else {
    nodes.set(info.rid, info);
  }
}

function removeNode(rid: string): void {
  nodes.delete(rid);
  removeDependencyNode(rid);
}

export function applyDebugEventToGraph(event: DebugEvent): void {
  switch (event.type) {
    case "reactive:created": {
      const meta = event.meta;
      const kind = kindFromMeta(meta);
      upsertNode({ rid: meta.rid, kind, meta });
      break;
    }
    case "reactive:updated": {
      const rid = event.rid;
      if (!nodes.has(rid)) {
        upsertNode({ rid, kind: "signal" });
      }
      break;
    }
    case "computed:recomputed": {
      const rid = event.rid;
      if (!nodes.has(rid)) {
        upsertNode({ rid, kind: "computed" });
      }
      break;
    }
    case "component:mounted": {
      const rid = componentRid(event.scope, event.instance);
      upsertNode({
        rid,
        kind: "component",
        scope: event.scope,
        instance: event.instance
      });
      break;
    }
    case "component:unmounted": {
      const rid = componentRid(event.scope, event.instance);
      removeNode(rid);
      break;
    }
    case "dom:updated": {
      if (!event.nodeId) break;
      const rid = event.rid ?? `dom#${event.nodeId}`;
      upsertNode({ rid, kind: "dom", domNodeId: event.nodeId });
      break;
    }
    case "route:changed": {
      const rid = `route:${event.to}`;
      upsertNode({ rid, kind: "route" });
      break;
    }
    default:
      break;
  }
}

export const ReactiveGraph = {
  applyEvent(event: DebugEvent): void {
    applyDebugEventToGraph(event);
  },
  getNodeInfo(rid: string): GraphNodeInfo | undefined {
    return nodes.get(rid);
  },
  getDependencyNode(rid: string): DependencyNode | undefined {
    return getDependencyNode(rid);
  },
  getAllNodes(): GraphNodeInfo[] {
    return Array.from(nodes.values());
  },
  getGraphSnapshot(): DependencyNode[] {
    return getDependencyGraphSnapshot();
  }
};

subscribeDebug((event) => {
  applyDebugEventToGraph(event);
});
