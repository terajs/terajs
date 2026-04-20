import type { AIStateSnapshot } from "@terajs/adapter-ai";
import { collectRecentAIDebugIssues, collectRecentCodeReferences, type AIDebugEventLike } from "./aiDebugContext.js";
import type { SafeDocumentContext } from "./documentContext.js";
import type { SafeDocumentDiagnostic } from "./documentContext.js";
import type { SanityAlert, SanityMetrics } from "./sanity.js";

export interface AIPromptEvent extends AIDebugEventLike {}

export interface AIPromptInput {
  snapshot: AIStateSnapshot;
  sanity: SanityMetrics;
  events: AIPromptEvent[];
  document?: SafeDocumentContext | null;
  documentDiagnostics?: SafeDocumentDiagnostic[];
}

/**
 * Builds a structured prompt for Terajs AI diagnostics.
 *
 * The prompt combines runtime snapshot state, sanity metrics, and recent
 * prioritized issues so AI-assisted triage can focus on root causes first.
 */
export function buildAIPrompt(input: AIPromptInput): string {
  const recentIssues = collectRecentAIDebugIssues(input.events, 12);
  const codeReferences = collectRecentCodeReferences(input.events, 10);
  const critical = input.sanity.alerts.filter((alert) => alert.severity === "critical");
  const warnings = input.sanity.alerts.filter((alert) => alert.severity === "warning");

  const payload = {
    document: input.document ?? undefined,
    documentDiagnostics: input.documentDiagnostics ?? undefined,
    snapshot: input.snapshot,
    sanity: {
      activeEffects: input.sanity.activeEffects,
      effectCreates: input.sanity.effectCreates,
      effectDisposes: input.sanity.effectDisposes,
      effectRunsPerSecond: input.sanity.effectRunsPerSecond,
      effectImbalance: input.sanity.effectImbalance,
      effectLifecycleConfidence: input.sanity.effectLifecycleConfidence,
      effectLifecycleReason: input.sanity.effectLifecycleReason,
      debugListenerCount: input.sanity.debugListenerCount,
      criticalAlerts: critical.map(toAlertSummary),
      warningAlerts: warnings.map(toAlertSummary)
    },
    recentIssues,
    codeReferences
  };

  return [
    "Terajs AI Debug Prompt:",
    "",
    "Analyze this snapshot and sanity telemetry.",
    "Use the safe document head summary to understand page intent, route context, and SEO metadata without assuming access to secrets or arbitrary DOM content.",
    "Use the code references to point the developer to likely implementation files and lines when the events provide source locations.",
    "If effectLifecycleConfidence is low, treat high create-dispose deltas as provisional startup evidence, not a confirmed leak. Ask for verification after navigation, HMR, or a cleared-event baseline before blaming app code.",
    "Prioritize root causes for runaway effects, listener leaks, and unstable update loops.",
    "Suggest concrete fixes and short verification steps.",
    "Return JSON only, without markdown fences, using this shape:",
    '{"summary":"...","likelyCauses":["..."],"codeReferences":[{"file":"src/example.ts","line":12,"column":4,"reason":"..."}],"nextChecks":["..."],"suggestedFixes":["..."]}',
    "If a field is unknown, keep the summary concise and return an empty array for that field.",
    "",
    JSON.stringify(payload, null, 2)
  ].join("\n");
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
