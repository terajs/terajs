export type DevtoolsAreaHostKind = "shadow" | "iframe";

export const LIVE_DEVTOOLS_TABS = [
  "Components",
  "AI Diagnostics",
  "Signals",
  "Meta",
  "Issues",
  "Logs",
  "Timeline",
  "Router",
  "Queue",
  "Performance",
  "Sanity Check"
] as const;

export type LiveDevtoolsTabName = typeof LIVE_DEVTOOLS_TABS[number];

export const LIVE_DEVTOOLS_AREA_HOSTS: Record<LiveDevtoolsTabName, DevtoolsAreaHostKind> = {
  Components: "shadow",
  "AI Diagnostics": "shadow",
  Signals: "iframe",
  Meta: "iframe",
  Issues: "iframe",
  Logs: "iframe",
  Timeline: "iframe",
  Router: "iframe",
  Queue: "iframe",
  Performance: "iframe",
  "Sanity Check": "iframe"
};

export type FutureDevtoolsAreaHostKind = Extract<DevtoolsAreaHostKind, "iframe">;

export interface FutureDevtoolsAreaIntent {
  id: string;
  title: string;
  hostKind: FutureDevtoolsAreaHostKind;
  intent: string;
}

export function resolveDevtoolsAreaHostKind(title: string): DevtoolsAreaHostKind {
  const liveHostKind = LIVE_DEVTOOLS_AREA_HOSTS[title as LiveDevtoolsTabName];
  if (liveHostKind) {
    return liveHostKind;
  }

  return FUTURE_DEVTOOLS_AREAS.some((area) => area.title === title) ? "iframe" : "shadow";
}

export const FUTURE_DEVTOOLS_AREAS: readonly FutureDevtoolsAreaIntent[] = [];