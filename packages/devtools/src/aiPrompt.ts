import type { AIStateSnapshot } from "@terajs/adapter-ai";
import type { SanityAlert, SanityMetrics } from "./sanity";

export interface AIPromptEvent {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
  level?: "info" | "warn" | "error";
}

export interface AIPromptInput {
  snapshot: AIStateSnapshot;
  sanity: SanityMetrics;
  events: AIPromptEvent[];
}

export function buildAIPrompt(input: AIPromptInput): string {
  const recentIssues = collectRecentIssues(input.events, 12);
  const critical = input.sanity.alerts.filter((alert) => alert.severity === "critical");
  const warnings = input.sanity.alerts.filter((alert) => alert.severity === "warning");

  const payload = {
    snapshot: input.snapshot,
    sanity: {
      activeEffects: input.sanity.activeEffects,
      effectCreates: input.sanity.effectCreates,
      effectDisposes: input.sanity.effectDisposes,
      effectRunsPerSecond: input.sanity.effectRunsPerSecond,
      effectImbalance: input.sanity.effectImbalance,
      debugListenerCount: input.sanity.debugListenerCount,
      criticalAlerts: critical.map(toAlertSummary),
      warningAlerts: warnings.map(toAlertSummary)
    },
    recentIssues
  };

  return [
    "Terajs AI Debug Prompt:",
    "",
    "Analyze this snapshot and sanity telemetry.",
    "Prioritize root causes for runaway effects, listener leaks, and unstable update loops.",
    "Suggest concrete fixes and short verification steps.",
    "",
    JSON.stringify(payload, null, 2)
  ].join("\n");
}

function collectRecentIssues(events: AIPromptEvent[], maxItems: number): Array<{
  type: string;
  level: "warn" | "error";
  message: string;
  timestamp: number;
}> {
  return events
    .filter((event) => isIssueEvent(event))
    .slice(-maxItems)
    .map((event) => ({
      type: event.type,
      level: event.level === "error" || event.type.startsWith("error:") ? "error" : "warn",
      message: summarizeIssue(event),
      timestamp: event.timestamp
    }));
}

function isIssueEvent(event: AIPromptEvent): boolean {
  return (
    event.level === "warn" ||
    event.level === "error" ||
    event.type.startsWith("error:") ||
    event.type.includes("warn") ||
    event.type.includes("hydration")
  );
}

function summarizeIssue(event: AIPromptEvent): string {
  const payload = event.payload;
  if (!payload) {
    return event.type;
  }

  const message = payload.message;
  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  const likelyCause = payload.likelyCause;
  if (typeof likelyCause === "string" && likelyCause.length > 0) {
    return likelyCause;
  }

  try {
    return JSON.stringify(payload).slice(0, 220);
  } catch {
    return "[unserializable payload]";
  }
}

function toAlertSummary(alert: SanityAlert): {
  id: string;
  message: string;
  current: number;
  threshold: number;
} {
  return {
    id: alert.id,
    message: alert.message,
    current: alert.current,
    threshold: alert.threshold
  };
}