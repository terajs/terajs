import { describe, expect, it } from "vitest";
import { buildAIPrompt } from "./aiPrompt";
import type { AIStateSnapshot } from "@terajs/adapter-ai";

describe("devtools ai prompt builder", () => {
  it("includes sanity telemetry and alerts", () => {
    const snapshot: AIStateSnapshot = {
      "@context": "https://schema.org",
      "@type": "TerajsStateSnapshot",
      generatedAt: "2026-04-10T00:00:00.000Z",
      signals: []
    };

    const prompt = buildAIPrompt({
      snapshot,
      sanity: {
        activeEffects: 11,
        effectCreates: 20,
        effectDisposes: 9,
        effectRunsPerSecond: 42.5,
        effectImbalance: 11,
        debugListenerCount: 6,
        alerts: [
          {
            id: "active-effects",
            severity: "critical",
            message: "Active effects exceeded threshold",
            current: 11,
            threshold: 10
          }
        ]
      },
      events: []
    });

    expect(prompt).toContain("sanity");
    expect(prompt).toContain("criticalAlerts");
    expect(prompt).toContain("active-effects");
    expect(prompt).toContain("effectRunsPerSecond");
  });

  it("adds recent issues for AI triage context", () => {
    const prompt = buildAIPrompt({
      snapshot: {
        "@context": "https://schema.org",
        "@type": "TerajsStateSnapshot",
        generatedAt: "2026-04-10T00:00:00.000Z",
        signals: []
      },
      sanity: {
        activeEffects: 0,
        effectCreates: 0,
        effectDisposes: 0,
        effectRunsPerSecond: 0,
        effectImbalance: 0,
        debugListenerCount: 0,
        alerts: []
      },
      events: [
        {
          type: "error:renderer",
          level: "error",
          timestamp: 1,
          payload: { message: "Render failed" }
        },
        {
          type: "route:warn",
          level: "warn",
          timestamp: 2,
          payload: { message: "Route fallback" }
        }
      ]
    });

    expect(prompt).toContain("recentIssues");
    expect(prompt).toContain("Render failed");
    expect(prompt).toContain("Route fallback");
  });
});
