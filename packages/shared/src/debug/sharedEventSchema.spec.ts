import { describe, expect, it } from "vitest";

import {
  getSharedDebugEventDefinition,
  isSharedDebugEventType,
  listSharedDebugEventDefinitions,
  normalizeSharedDebugEvent,
} from "./sharedEventSchema.js";

describe("shared debug event schema", () => {
  it("documents the narrow shared subset by category", () => {
    expect(listSharedDebugEventDefinitions("state").map((definition) => definition.type)).toEqual([
      "reactive:updated"
    ]);

    expect(listSharedDebugEventDefinitions("bridge").map((definition) => definition.type)).toEqual([
      "bridge:commands",
      "bridge:event",
      "bridge:error"
    ]);

    expect(getSharedDebugEventDefinition("queue:flush").requiredPayloadKeys).toEqual([
      "flushed",
      "retried",
      "failed",
      "skipped",
      "pending"
    ]);
  });

  it("normalizes live reactive updates into the payload-based shared shape", () => {
    expect(normalizeSharedDebugEvent({
      type: "reactive:updated",
      timestamp: 100,
      rid: "reactive:count",
      prev: 1,
      next: 2
    })).toEqual({
      type: "reactive:updated",
      timestamp: 100,
      payload: {
        rid: "reactive:count",
        prev: 1,
        next: 2
      },
      level: undefined,
      file: undefined,
      line: undefined,
      column: undefined
    });
  });

  it("accepts replay-style route and queue events when required keys are present", () => {
    expect(normalizeSharedDebugEvent({
      type: "route:changed",
      timestamp: 110,
      payload: {
        from: "/",
        to: "/proof"
      }
    })).toEqual({
      type: "route:changed",
      timestamp: 110,
      payload: {
        from: "/",
        to: "/proof"
      },
      level: undefined,
      file: undefined,
      line: undefined,
      column: undefined
    });

    expect(normalizeSharedDebugEvent({
      type: "queue:flush",
      timestamp: 120,
      payload: {
        flushed: 2,
        retried: 1,
        failed: 0,
        skipped: 0,
        pending: 0
      }
    })).toEqual({
      type: "queue:flush",
      timestamp: 120,
      payload: {
        flushed: 2,
        retried: 1,
        failed: 0,
        skipped: 0,
        pending: 0
      },
      level: undefined,
      file: undefined,
      line: undefined,
      column: undefined
    });
  });

  it("rejects unknown event types and shared events missing required keys", () => {
    expect(isSharedDebugEventType("bridge:error")).toBe(true);
    expect(isSharedDebugEventType("component:update")).toBe(false);

    expect(normalizeSharedDebugEvent({
      type: "component:update",
      timestamp: 130,
      payload: {}
    })).toBeNull();

    expect(normalizeSharedDebugEvent({
      type: "bridge:event",
      timestamp: 140,
      payload: {
        target: "android",
        direction: "host-to-js"
      }
    })).toBeNull();
  });
});