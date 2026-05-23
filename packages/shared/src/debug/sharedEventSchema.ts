import type { DebugEventType } from "./events.js";
import { normalizePersistedDebugEvent, type PersistedDebugEvent } from "./history.js";

export type SharedDebugEventCategory = "state" | "route" | "queue" | "bridge";
export type SharedDebugEventTarget = "web" | "android" | "ios";

/**
 * Canonical payload-based schema for the debug events that need to stay stable
 * across live listeners, replay hydration, and the shared web/native proof work.
 */
export interface SharedDebugEventDefinition<TType extends string = string> {
  category: SharedDebugEventCategory;
  description: string;
  requiredPayloadKeys: readonly string[];
  targets: readonly SharedDebugEventTarget[];
  type: TType;
}

const sharedDebugEventDefinitions = [
  {
    type: "reactive:updated",
    category: "state",
    targets: ["web", "android", "ios"],
    description: "JS-owned reactive state changed and can be correlated by reactive id.",
    requiredPayloadKeys: ["rid"]
  },
  {
    type: "route:navigate:start",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "A route transition started for a concrete destination.",
    requiredPayloadKeys: ["to"]
  },
  {
    type: "route:load:start",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "Route-owned loading work began for a concrete destination.",
    requiredPayloadKeys: ["to"]
  },
  {
    type: "route:load:end",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "Route-owned loading work finished for a concrete destination.",
    requiredPayloadKeys: ["to"]
  },
  {
    type: "route:changed",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "The active route changed to a concrete destination.",
    requiredPayloadKeys: ["to"]
  },
  {
    type: "route:blocked",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "A route transition was blocked by middleware or prerequisites.",
    requiredPayloadKeys: ["to"]
  },
  {
    type: "route:redirect",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "A route transition redirected to a different destination.",
    requiredPayloadKeys: ["to", "redirectTo"]
  },
  {
    type: "route:warn",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "A non-fatal routing issue occurred.",
    requiredPayloadKeys: ["message"]
  },
  {
    type: "route:meta:resolved",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "Route metadata resolved for a concrete destination.",
    requiredPayloadKeys: ["to", "meta"]
  },
  {
    type: "error:router",
    category: "route",
    targets: ["web", "android", "ios"],
    description: "A routing failure occurred.",
    requiredPayloadKeys: ["message"]
  },
  {
    type: "queue:enqueue",
    category: "queue",
    targets: ["web", "android", "ios"],
    description: "A mutation entered the queue.",
    requiredPayloadKeys: ["id", "type"]
  },
  {
    type: "queue:conflict",
    category: "queue",
    targets: ["web", "android", "ios"],
    description: "A queued mutation conflicted with an existing entry.",
    requiredPayloadKeys: ["id", "type", "decision"]
  },
  {
    type: "queue:retry",
    category: "queue",
    targets: ["web", "android", "ios"],
    description: "A queued mutation scheduled another retry attempt.",
    requiredPayloadKeys: ["id", "type", "attempts"]
  },
  {
    type: "queue:fail",
    category: "queue",
    targets: ["web", "android", "ios"],
    description: "A queued mutation exhausted retries and failed.",
    requiredPayloadKeys: ["id", "type", "attempts", "error"]
  },
  {
    type: "queue:flush",
    category: "queue",
    targets: ["web", "android", "ios"],
    description: "A queue flush completed with aggregate counts.",
    requiredPayloadKeys: ["flushed", "retried", "failed", "skipped", "pending"]
  },
  {
    type: "queue:drained",
    category: "queue",
    targets: ["web", "android", "ios"],
    description: "The queue drained after one or more flush attempts.",
    requiredPayloadKeys: ["flushed", "failed"]
  },
  {
    type: "bridge:commands",
    category: "bridge",
    targets: ["android", "ios"],
    description: "A native bridge drained a JS-to-host command batch.",
    requiredPayloadKeys: ["target", "direction", "commandCount"]
  },
  {
    type: "bridge:event",
    category: "bridge",
    targets: ["android", "ios"],
    description: "A native bridge delivered a host event packet back into JS.",
    requiredPayloadKeys: ["target", "direction", "eventName", "nodeId"]
  },
  {
    type: "bridge:error",
    category: "bridge",
    targets: ["android", "ios"],
    description: "A native bridge operation failed.",
    requiredPayloadKeys: ["target", "message"]
  }
] as const satisfies readonly SharedDebugEventDefinition<DebugEventType>[];

export type SharedDebugEventType = typeof sharedDebugEventDefinitions[number]["type"];
export type SharedDebugEvent = PersistedDebugEvent & {
  type: SharedDebugEventType;
  payload: Record<string, unknown>;
};

export const SHARED_DEBUG_EVENT_DEFINITIONS: readonly SharedDebugEventDefinition<SharedDebugEventType>[] =
  sharedDebugEventDefinitions;
export const SHARED_DEBUG_EVENT_TYPES: readonly SharedDebugEventType[] =
  sharedDebugEventDefinitions.map((definition) => definition.type) as readonly SharedDebugEventType[];

const sharedDebugEventDefinitionMap = new Map<
  SharedDebugEventType,
  SharedDebugEventDefinition<SharedDebugEventType>
>(sharedDebugEventDefinitions.map((definition) => [definition.type, definition]));
const sharedDebugEventTypeSet = new Set<string>(SHARED_DEBUG_EVENT_TYPES);

export function getSharedDebugEventDefinition(
  type: SharedDebugEventType
): SharedDebugEventDefinition<SharedDebugEventType> {
  return sharedDebugEventDefinitionMap.get(type)!;
}

export function isSharedDebugEventType(type: string): type is SharedDebugEventType {
  return sharedDebugEventTypeSet.has(type);
}

export function listSharedDebugEventDefinitions(
  category?: SharedDebugEventCategory
): readonly SharedDebugEventDefinition<SharedDebugEventType>[] {
  if (!category) {
    return SHARED_DEBUG_EVENT_DEFINITIONS;
  }

  return SHARED_DEBUG_EVENT_DEFINITIONS.filter((definition) => definition.category === category);
}

/**
 * Normalizes a live or replay debug event into the canonical shared subset.
 * Events outside the shared subset or missing their minimum payload keys are rejected.
 */
export function normalizeSharedDebugEvent(rawEvent: unknown): SharedDebugEvent | null {
  const normalized = normalizePersistedDebugEvent(rawEvent);
  if (!normalized || !isSharedDebugEventType(normalized.type)) {
    return null;
  }

  const payload = normalized.payload ?? {};
  if (!hasRequiredPayloadKeys(payload, getSharedDebugEventDefinition(normalized.type).requiredPayloadKeys)) {
    return null;
  }

  return {
    ...normalized,
    type: normalized.type,
    payload
  };
}

function hasRequiredPayloadKeys(payload: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.every((key) => payload[key] !== undefined);
}