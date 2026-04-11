import { describe, expect, it } from "vitest";
import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "./sanity";
import type { DevtoolsEventLike } from "./analytics";

describe("devtools sanity metrics", () => {
  it("returns empty alerts for healthy event streams", () => {
    const now = 10_000;
    const events: DevtoolsEventLike[] = [
      { type: "effect:create", timestamp: now - 2000 },
      { type: "effect:run", timestamp: now - 1500 },
      { type: "effect:dispose", timestamp: now - 1000 }
    ];

    const metrics = computeSanityMetrics(events, {
      ...DEFAULT_SANITY_THRESHOLDS,
      debugListenerCount: 2
    });

    expect(metrics.alerts).toEqual([]);
    expect(metrics.activeEffects).toBe(0);
  });

  it("flags critical alert when active effects exceed threshold", () => {
    const now = 10_000;
    const events: DevtoolsEventLike[] = [];

    for (let i = 0; i < 8; i += 1) {
      events.push({ type: "effect:create", timestamp: now - i * 10 });
    }

    const metrics = computeSanityMetrics(events, {
      lookbackMs: 1000,
      maxActiveEffects: 5,
      maxEffectRunsPerSecond: 999,
      maxEffectImbalance: 999,
      maxDebugListeners: 999,
      debugListenerCount: 0
    });

    expect(metrics.alerts.some((alert) => alert.id === "active-effects" && alert.severity === "critical")).toBe(true);
  });

  it("flags critical alert for high effect run rate", () => {
    const now = 10_000;
    const events: DevtoolsEventLike[] = [];

    for (let i = 0; i < 20; i += 1) {
      events.push({ type: "effect:run", timestamp: now - i * 20 });
    }

    const metrics = computeSanityMetrics(events, {
      lookbackMs: 1000,
      maxActiveEffects: 999,
      maxEffectRunsPerSecond: 10,
      maxEffectImbalance: 999,
      maxDebugListeners: 999,
      debugListenerCount: 0
    });

    expect(metrics.alerts.some((alert) => alert.id === "effect-runs-per-second" && alert.severity === "critical")).toBe(true);
  });

  it("flags listener growth when debug listeners exceed threshold", () => {
    const metrics = computeSanityMetrics([], {
      ...DEFAULT_SANITY_THRESHOLDS,
      maxDebugListeners: 4,
      debugListenerCount: 7
    });

    expect(metrics.alerts.some((alert) => alert.id === "debug-listeners" && alert.severity === "critical")).toBe(true);
  });
});
