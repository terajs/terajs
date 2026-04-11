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

  it("prioritizes queue failures, conflicts, and missing handlers", () => {
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
          type: "queue:retry",
          timestamp: 1,
          payload: {
            type: "note:save",
            attempts: 1,
            delayMs: 200
          }
        },
        {
          type: "queue:fail",
          timestamp: 2,
          payload: {
            type: "note:save",
            attempts: 3,
            error: "offline"
          }
        },
        {
          type: "queue:conflict",
          timestamp: 3,
          payload: {
            type: "profile:save",
            decision: "merge"
          }
        },
        {
          type: "queue:skip:missing-handler",
          timestamp: 4,
          payload: {
            type: "draft:sync"
          }
        }
      ]
    });

    expect(prompt).toContain("Queue mutation note:save failed after 3 attempts: offline");
    expect(prompt).toContain("Queue conflict for profile:save resolved as merge");
    expect(prompt).toContain("Queue handler missing for mutation type draft:sync");
    expect(prompt).not.toContain('"type": "queue:retry"');
  });

  it("adds hub connectivity failures to AI triage issues", () => {
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
          type: "hub:error",
          timestamp: 1,
          payload: {
            transport: "signalr",
            message: "handshake timeout"
          }
        },
        {
          type: "hub:disconnect",
          timestamp: 2,
          payload: {
            transport: "signalr",
            reason: "network"
          }
        }
      ]
    });

    expect(prompt).toContain("Realtime signalr transport error: handshake timeout");
    expect(prompt).toContain("Realtime signalr disconnected: network");
  });
});
