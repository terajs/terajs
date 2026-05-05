import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  computeRouterMetrics,
  computePerformanceMetrics,
  replayEventsAtIndex,
  summarizeEvent,
  type DevtoolsEventLike,
} from "./analytics";

describe("devtools analytics", () => {
  it("summarizes common payload shapes", () => {
    const keyEvent: DevtoolsEventLike = {
      type: "signal:update",
      timestamp: 1,
      payload: { key: "count", value: 2 },
    };

    const nameEvent: DevtoolsEventLike = {
      type: "component:mount",
      timestamp: 2,
      payload: { name: "Counter" },
    };

    expect(summarizeEvent(keyEvent)).toContain("key=count");
    expect(summarizeEvent(nameEvent)).toContain("name=Counter");

    const nestedEvent: DevtoolsEventLike = {
      type: "dom:insert",
      timestamp: 3,
      payload: { parent: { id: "app" }, child: { id: "hero" } },
    };

    expect(summarizeEvent(nestedEvent)).toContain("parent=Object(1)");
    expect(summarizeEvent(nestedEvent)).toContain("child=Object(1)");
  });

  it("builds a bounded timeline with global indexes", () => {
    const events: DevtoolsEventLike[] = [
      { type: "a", timestamp: 1, payload: { step: 1 } },
      { type: "b", timestamp: 2, payload: { step: 2 } },
      { type: "c", timestamp: 3, payload: { step: 3 } },
    ];

    const timeline = buildTimeline(events, 2);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].index).toBe(1);
    expect(timeline[1].index).toBe(2);
    expect(timeline[0].type).toBe("b");
    expect(timeline[1].type).toBe("c");
    expect(timeline[0].payload).toEqual({ step: 2 });
  });

  it("replays events up to cursor index", () => {
    const events = ["e0", "e1", "e2", "e3"];
    expect(replayEventsAtIndex(events, -1)).toEqual([]);
    expect(replayEventsAtIndex(events, 1)).toEqual(["e0", "e1"]);
    expect(replayEventsAtIndex(events, 9)).toEqual(events);
  });

  it("computes performance metrics for a window", () => {
    const events: DevtoolsEventLike[] = [
      { type: "effect:run", timestamp: 1000, payload: {} },
      { type: "component:render:start", timestamp: 1200, payload: {} },
      { type: "effect:run", timestamp: 1400, payload: {} },
      { type: "signal:update", timestamp: 1600, payload: { key: "count" } },
      { type: "effect:run", timestamp: 1800, payload: {} },
      { type: "effect:run", timestamp: 2000, payload: {} },
      { type: "effect:run", timestamp: 2200, payload: {} },
    ];

    const metrics = computePerformanceMetrics(events, 1500);

    expect(metrics.totalEvents).toBe(7);
    expect(metrics.effectRuns).toBe(5);
    expect(metrics.renderEvents).toBe(1);
    expect(metrics.hubConnections).toBe(0);
    expect(metrics.hubDisconnections).toBe(0);
    expect(metrics.hubErrors).toBe(0);
    expect(metrics.hubPushReceived).toBe(0);
    expect(metrics.queueEnqueued).toBe(0);
    expect(metrics.queueConflicts).toBe(0);
    expect(metrics.queueRetried).toBe(0);
    expect(metrics.queueFailed).toBe(0);
    expect(metrics.queueFlushed).toBe(0);
    expect(metrics.queueDepthEstimate).toBe(0);
    expect(metrics.byType[0].type).toBe("effect:run");
    expect(metrics.hotTypes).toContain("effect:run");
    expect(metrics.updatesPerSecond).toBe(4.67);
  });

  it("tracks queue metrics from queue lifecycle events", () => {
    const events: DevtoolsEventLike[] = [
      { type: "queue:enqueue", timestamp: 1000, payload: { id: "1" } },
      { type: "queue:enqueue", timestamp: 1200, payload: { id: "2" } },
      { type: "queue:conflict", timestamp: 1300, payload: { id: "2", decision: "replace" } },
      { type: "queue:retry", timestamp: 1400, payload: { id: "2" } },
      { type: "queue:fail", timestamp: 1600, payload: { id: "2" } },
      { type: "queue:flush", timestamp: 1750, payload: { flushed: 1, retried: 1, failed: 1, skipped: 0, pending: 0 } },
      { type: "queue:drained", timestamp: 1800, payload: { flushed: 1, failed: 1 } }
    ];

    const metrics = computePerformanceMetrics(events, 2000);

    expect(metrics.queueEnqueued).toBe(2);
    expect(metrics.queueConflicts).toBe(1);
    expect(metrics.queueRetried).toBe(1);
    expect(metrics.queueFailed).toBe(1);
    expect(metrics.queueFlushed).toBe(1);
    expect(metrics.queueDepthEstimate).toBe(0);
  });

  it("uses queue flush payload counts for partial flushes", () => {
    const events: DevtoolsEventLike[] = [
      { type: "queue:enqueue", timestamp: 1000, payload: { id: "1" } },
      { type: "queue:enqueue", timestamp: 1100, payload: { id: "2" } },
      { type: "queue:enqueue", timestamp: 1200, payload: { id: "3" } },
      { type: "queue:flush", timestamp: 1300, payload: { flushed: 2, retried: 0, failed: 0, skipped: 0, pending: 1 } }
    ];

    const metrics = computePerformanceMetrics(events, 2000);

    expect(metrics.queueEnqueued).toBe(3);
    expect(metrics.queueFlushed).toBe(2);
    expect(metrics.queueDepthEstimate).toBe(1);
  });

  it("falls back to queue drained payloads when flush events are absent", () => {
    const events: DevtoolsEventLike[] = [
      { type: "queue:enqueue", timestamp: 1000, payload: { id: "1" } },
      { type: "queue:enqueue", timestamp: 1100, payload: { id: "2" } },
      { type: "queue:fail", timestamp: 1200, payload: { id: "2" } },
      { type: "queue:drained", timestamp: 1300, payload: { flushed: 1, failed: 1 } }
    ];

    const metrics = computePerformanceMetrics(events, 2000);

    expect(metrics.queueFlushed).toBe(1);
    expect(metrics.queueDepthEstimate).toBe(0);
  });

  it("tracks hub connectivity and push metrics", () => {
    const events: DevtoolsEventLike[] = [
      { type: "hub:connect", timestamp: 1000, payload: { transport: "signalr" } },
      { type: "hub:push:received", timestamp: 1100, payload: { type: "invalidate", keys: ["docs"] } },
      { type: "hub:error", timestamp: 1200, payload: { message: "socket closed" } },
      { type: "hub:disconnect", timestamp: 1300, payload: { reason: "network" } }
    ];

    const metrics = computePerformanceMetrics(events, 2000);

    expect(metrics.hubConnections).toBe(1);
    expect(metrics.hubDisconnections).toBe(1);
    expect(metrics.hubErrors).toBe(1);
    expect(metrics.hubPushReceived).toBe(1);
  });

  it("returns empty metrics when no events are present", () => {
    const metrics = computePerformanceMetrics([]);
    expect(metrics.totalEvents).toBe(0);
    expect(metrics.hubConnections).toBe(0);
    expect(metrics.hubDisconnections).toBe(0);
    expect(metrics.hubErrors).toBe(0);
    expect(metrics.hubPushReceived).toBe(0);
    expect(metrics.queueDepthEstimate).toBe(0);
    expect(metrics.byType).toEqual([]);
    expect(metrics.hotTypes).toEqual([]);
  });

  it("computes router metrics and route-level summaries", () => {
    const events: DevtoolsEventLike[] = [
      { type: "route:navigate:start", timestamp: 1000, payload: { to: "/" } },
      { type: "route:load:start", timestamp: 1020, payload: { to: "/", route: "/" } },
      { type: "route:load:end", timestamp: 1080, payload: { to: "/", route: "/" } },
      { type: "route:changed", timestamp: 1100, payload: { from: null, to: "/" } },
      { type: "route:navigate:end", timestamp: 1110, payload: { to: "/" } },
      { type: "route:navigate:start", timestamp: 1200, payload: { to: "/rc" } },
      { type: "route:blocked", timestamp: 1220, payload: { to: "/rc", middleware: ["auth"] } },
      { type: "route:warn", timestamp: 1230, payload: { message: "Navigation blocked" } },
      { type: "error:router", timestamp: 1240, payload: { message: "Route render failed", to: "/rc" } }
    ];

    const metrics = computeRouterMetrics(events, 5000);

    expect(metrics.totalRouteEvents).toBe(9);
    expect(metrics.navigationStarts).toBe(2);
    expect(metrics.navigationEnds).toBe(1);
    expect(metrics.routeChanges).toBe(1);
    expect(metrics.blocked).toBe(1);
    expect(metrics.redirects).toBe(0);
    expect(metrics.errors).toBe(1);
    expect(metrics.warnings).toBe(1);
    expect(metrics.loadStarts).toBe(1);
    expect(metrics.loadEnds).toBe(1);
    expect(metrics.currentRoute).toBe("/");
    expect(metrics.avgLoadMs).toBe(60);
    expect(metrics.maxLoadMs).toBe(60);
    expect(metrics.byRoute.find((entry) => entry.route === "/")?.hits).toBe(1);
    expect(metrics.byRoute.find((entry) => entry.route === "/rc")?.blocked).toBe(1);
    expect(metrics.byRoute.find((entry) => entry.route === "/rc")?.errors).toBe(1);
  });
});