import { describe, expect, it } from "vitest";
import {
  buildTimeline,
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
    expect(metrics.queueEnqueued).toBe(0);
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
      { type: "queue:retry", timestamp: 1400, payload: { id: "2" } },
      { type: "queue:fail", timestamp: 1600, payload: { id: "2" } },
      { type: "queue:drained", timestamp: 1800, payload: { flushed: 1 } }
    ];

    const metrics = computePerformanceMetrics(events, 2000);

    expect(metrics.queueEnqueued).toBe(2);
    expect(metrics.queueRetried).toBe(1);
    expect(metrics.queueFailed).toBe(1);
    expect(metrics.queueFlushed).toBe(1);
    expect(metrics.queueDepthEstimate).toBe(0);
  });

  it("returns empty metrics when no events are present", () => {
    const metrics = computePerformanceMetrics([]);
    expect(metrics.totalEvents).toBe(0);
    expect(metrics.queueDepthEstimate).toBe(0);
    expect(metrics.byType).toEqual([]);
    expect(metrics.hotTypes).toEqual([]);
  });
});