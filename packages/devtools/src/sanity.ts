import type { DevtoolsEventLike } from "./analytics.js";

export type SanitySeverity = "warning" | "critical";
export type SanityEvidenceConfidence = "low" | "normal";

export interface SanityAlert {
  id: string;
  severity: SanitySeverity;
  message: string;
  current: number;
  threshold: number;
  confidence: SanityEvidenceConfidence;
}

export interface SanityThresholds {
  lookbackMs: number;
  maxActiveEffects: number;
  maxEffectRunsPerSecond: number;
  maxEffectImbalance: number;
  maxDebugListeners: number;
}

export interface SanityMetrics {
  activeEffects: number;
  effectCreates: number;
  effectDisposes: number;
  effectRunsPerSecond: number;
  effectImbalance: number;
  debugListenerCount: number;
  effectLifecycleConfidence: SanityEvidenceConfidence;
  effectLifecycleReason: string | null;
  alerts: SanityAlert[];
}

export const DEFAULT_SANITY_THRESHOLDS: SanityThresholds = {
  lookbackMs: 10000,
  maxActiveEffects: 150,
  maxEffectRunsPerSecond: 90,
  maxEffectImbalance: 60,
  maxDebugListeners: 20
};

interface SanityOptions extends Partial<SanityThresholds> {
  debugListenerCount?: number;
}

export function computeSanityMetrics(
  events: DevtoolsEventLike[],
  options: SanityOptions = {}
): SanityMetrics {
  const thresholds: SanityThresholds = {
    ...DEFAULT_SANITY_THRESHOLDS,
    ...options
  };

  const latestTimestamp = events.at(-1)?.timestamp ?? Date.now();
  const windowStart = latestTimestamp - thresholds.lookbackMs;
  const windowed = events.filter((event) => event.timestamp >= windowStart);

  const effectCreates = countTypes(windowed, ["effect:create"]);
  const effectDisposes = countTypes(windowed, ["effect:dispose", "effect:dispose:end"]);
  const effectRuns = countTypes(windowed, ["effect:run"]);
  const mountEvents = countTypes(windowed, ["template:mount", "component:mount", "component:mounted"]);
  const windowSeconds = Math.max(1, thresholds.lookbackMs / 1000);
  const effectRunsPerSecond = Number((effectRuns / windowSeconds).toFixed(2));
  const activeEffects = Math.max(0, effectCreates - effectDisposes);
  const effectImbalance = Math.max(0, effectCreates - effectDisposes);
  const debugListenerCount = Math.max(0, options.debugListenerCount ?? 0);
  const effectLifecycleConfidence: SanityEvidenceConfidence = effectCreates > 0 && effectDisposes === 0 && mountEvents > 0
    ? "low"
    : "normal";
  const effectLifecycleReason = effectLifecycleConfidence === "low"
    ? "The current window shows effect creation during initial template or component mount, but no teardown evidence yet. Verify after navigation, HMR, or a cleared-event baseline before calling this a leak."
    : null;

  const alerts: SanityAlert[] = [];

  pushThresholdAlert({
    alerts,
    id: "active-effects",
    label: "Active effects",
    current: activeEffects,
    threshold: thresholds.maxActiveEffects,
    confidence: effectLifecycleConfidence,
    lowConfidenceMessage: "Active effects are high during the initial mount window; verify after navigation, HMR, or a cleared baseline."
  });

  pushThresholdAlert({
    alerts,
    id: "effect-runs-per-second",
    label: "Effect runs/sec",
    current: effectRunsPerSecond,
    threshold: thresholds.maxEffectRunsPerSecond,
    confidence: "normal"
  });

  pushThresholdAlert({
    alerts,
    id: "effect-imbalance",
    label: "Effect create-dispose imbalance",
    current: effectImbalance,
    threshold: thresholds.maxEffectImbalance,
    confidence: effectLifecycleConfidence,
    lowConfidenceMessage: "Create-dispose imbalance is high during the initial mount window; verify after navigation, HMR, or a cleared baseline."
  });

  pushThresholdAlert({
    alerts,
    id: "debug-listeners",
    label: "Debug listeners",
    current: debugListenerCount,
    threshold: thresholds.maxDebugListeners,
    confidence: "normal"
  });

  return {
    activeEffects,
    effectCreates,
    effectDisposes,
    effectRunsPerSecond,
    effectImbalance,
    debugListenerCount,
    effectLifecycleConfidence,
    effectLifecycleReason,
    alerts
  };
}

function countTypes(events: DevtoolsEventLike[], types: string[]): number {
  const lookup = new Set(types);
  return events.reduce((count, event) => count + (lookup.has(event.type) ? 1 : 0), 0);
}

function pushThresholdAlert(args: {
  alerts: SanityAlert[];
  id: string;
  label: string;
  current: number;
  threshold: number;
  confidence: SanityEvidenceConfidence;
  lowConfidenceMessage?: string;
}): void {
  const { alerts, id, label, current, threshold, confidence, lowConfidenceMessage } = args;
  const lowConfidence = confidence === "low";

  if (current > threshold) {
    alerts.push({
      id,
      severity: lowConfidence ? "warning" : "critical",
      message: lowConfidence && lowConfidenceMessage ? lowConfidenceMessage : `${label} exceeded threshold`,
      current,
      threshold,
      confidence
    });
    return;
  }

  const warningThreshold = threshold * 0.8;
  if (current > warningThreshold) {
    alerts.push({
      id,
      severity: "warning",
      message: lowConfidence && lowConfidenceMessage ? lowConfidenceMessage : `${label} is trending high`,
      current,
      threshold,
      confidence
    });
  }
}