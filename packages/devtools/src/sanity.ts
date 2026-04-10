import type { DevtoolsEventLike } from "./analytics";

export type SanitySeverity = "warning" | "critical";

export interface SanityAlert {
  id: string;
  severity: SanitySeverity;
  message: string;
  current: number;
  threshold: number;
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
  const windowSeconds = Math.max(1, thresholds.lookbackMs / 1000);
  const effectRunsPerSecond = Number((effectRuns / windowSeconds).toFixed(2));
  const activeEffects = Math.max(0, effectCreates - effectDisposes);
  const effectImbalance = Math.max(0, effectCreates - effectDisposes);
  const debugListenerCount = Math.max(0, options.debugListenerCount ?? 0);

  const alerts: SanityAlert[] = [];

  pushThresholdAlert({
    alerts,
    id: "active-effects",
    label: "Active effects",
    current: activeEffects,
    threshold: thresholds.maxActiveEffects
  });

  pushThresholdAlert({
    alerts,
    id: "effect-runs-per-second",
    label: "Effect runs/sec",
    current: effectRunsPerSecond,
    threshold: thresholds.maxEffectRunsPerSecond
  });

  pushThresholdAlert({
    alerts,
    id: "effect-imbalance",
    label: "Effect create-dispose imbalance",
    current: effectImbalance,
    threshold: thresholds.maxEffectImbalance
  });

  pushThresholdAlert({
    alerts,
    id: "debug-listeners",
    label: "Debug listeners",
    current: debugListenerCount,
    threshold: thresholds.maxDebugListeners
  });

  return {
    activeEffects,
    effectCreates,
    effectDisposes,
    effectRunsPerSecond,
    effectImbalance,
    debugListenerCount,
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
}): void {
  const { alerts, id, label, current, threshold } = args;

  if (current > threshold) {
    alerts.push({
      id,
      severity: "critical",
      message: `${label} exceeded threshold`,
      current,
      threshold
    });
    return;
  }

  const warningThreshold = threshold * 0.8;
  if (current > warningThreshold) {
    alerts.push({
      id,
      severity: "warning",
      message: `${label} is trending high`,
      current,
      threshold
    });
  }
}