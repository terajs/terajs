import { buildTimeline, computePerformanceMetrics, replayEventsAtIndex } from "./analytics.js";
import { Debug, getDebugListenerCount, subscribeDebug } from "@terajs/shared";
import { captureStateSnapshot } from "@terajs/adapter-ai";
import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "./sanity.js";
import { buildAIPrompt } from "./aiPrompt.js";

export interface DevtoolsEvent {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
  level?: "info" | "warn" | "error";
  file?: string;
  line?: number;
  column?: number;
}

export interface DevtoolsAIAssistantOptions {
  enabled?: boolean;
  endpoint?: string;
  model?: string;
  timeoutMs?: number;
}

export interface DevtoolsAppOptions {
  ai?: DevtoolsAIAssistantOptions;
}

interface NormalizedAIAssistantOptions {
  enabled: boolean;
  endpoint: string | null;
  model: string;
  timeoutMs: number;
}

interface AIAssistantRequest {
  prompt: string;
  snapshot: ReturnType<typeof captureStateSnapshot>;
  sanity: ReturnType<typeof computeSanityMetrics>;
  events: DevtoolsEvent[];
}

type AIAssistantHook = (request: AIAssistantRequest) => Promise<unknown> | unknown;

declare global {
  interface Window {
    __TERAJS_AI_ASSISTANT__?: AIAssistantHook;
  }
}

type TabName =
  | "Components"
  | "AI Diagnostics"
  | "Signals"
  | "Meta"
  | "Issues"
  | "Logs"
  | "Timeline"
  | "Queue"
  | "Performance"
  | "Sanity Check"
  | "Settings";

interface DevtoolsState {
  activeTab: TabName;
  events: DevtoolsEvent[];
  eventCount: number;
  selectedMetaKey: string | null;
  logFilter: "all" | "component" | "signal" | "effect" | "error" | "hub";
  timelineCursor: number;
  theme: "dark" | "light";
  aiPrompt: string | null;
  aiLikelyCause: string | null;
  aiStatus: "idle" | "loading" | "ready" | "error";
  aiResponse: string | null;
  aiError: string | null;
}

const TABS: TabName[] = [
  "Components",
  "AI Diagnostics",
  "Signals",
  "Meta",
  "Issues",
  "Logs",
  "Timeline",
  "Queue",
  "Performance",
  "Sanity Check",
  "Settings"
];

export function mountDevtoolsApp(root: HTMLElement, options: DevtoolsAppOptions = {}): () => void {
  const aiOptions = normalizeAIAssistantOptions(options.ai);
  const state: DevtoolsState = {
    activeTab: "Components",
    events: [],
    eventCount: 0,
    selectedMetaKey: null,
    logFilter: "all",
    timelineCursor: -1,
    theme: "dark",
    aiPrompt: null,
    aiLikelyCause: null,
    aiStatus: "idle",
    aiResponse: null,
    aiError: null
  };
  let aiRequestToken = 0;

  const appendEvent = (rawEvent: unknown) => {
    const event = normalizeEvent(rawEvent);
    if (!event) return;

    if (event.type === "reactive:error" || event.type === "error:reactivity") {
      const likelyCause = generateLikelyCause(event.payload);
      if (likelyCause) {
        event.payload = { ...event.payload, likelyCause };
        state.aiLikelyCause = likelyCause;
      }
    }

    state.events = [...state.events.slice(-249), event];
    state.eventCount += 1;
    state.timelineCursor = state.events.length - 1;
    render();
  };

  const unsubDebug = Debug.on(appendEvent);
  const unsubEventBus = subscribeDebug(appendEvent, { replay: true });

  const handleClick = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLElement)) return;

    const tab = target.closest<HTMLElement>("[data-tab]")?.dataset.tab as TabName | undefined;
    if (tab) {
      state.activeTab = tab;
      render();
      return;
    }

    const logFilter = target.closest<HTMLElement>("[data-log-filter]")?.dataset.logFilter as DevtoolsState["logFilter"] | undefined;
    if (logFilter) {
      state.logFilter = logFilter;
      render();
      return;
    }

    const metaKey = target.closest<HTMLElement>("[data-meta-key]")?.dataset.metaKey;
    if (metaKey) {
      state.selectedMetaKey = metaKey;
      render();
      return;
    }

    if (target.closest("[data-action='ask-ai']")) {
      const snapshot = captureStateSnapshot();
      const sanity = computeSanityMetrics(state.events, {
        ...DEFAULT_SANITY_THRESHOLDS,
        debugListenerCount: getDebugListenerCount()
      });

      state.aiPrompt = buildAIPrompt({
        snapshot,
        sanity,
        events: state.events
      });
      state.aiError = null;
      state.aiResponse = null;

      const prompt = state.aiPrompt;
      if (!prompt) {
        state.aiStatus = "error";
        state.aiError = "Unable to generate an AI prompt for the current state.";
        render();
        return;
      }

      if (!aiOptions.enabled) {
        state.aiStatus = "idle";
        render();
        return;
      }

      const hasGlobalHook = getGlobalAIAssistantHook() !== null;
      if (!hasGlobalHook && !aiOptions.endpoint) {
        state.aiStatus = "idle";
        render();
        return;
      }

      const token = ++aiRequestToken;
      state.aiStatus = "loading";
      render();

      void resolveAIAssistantResponse({
        prompt,
        snapshot,
        sanity,
        events: state.events.slice(-120)
      }, aiOptions).then((response) => {
        if (token !== aiRequestToken) {
          return;
        }

        state.aiStatus = "ready";
        state.aiResponse = response;
        state.aiError = null;
        render();
      }).catch((error) => {
        if (token !== aiRequestToken) {
          return;
        }

        state.aiStatus = "error";
        state.aiError = error instanceof Error ? error.message : "AI request failed.";
        state.aiResponse = null;
        render();
      });
      return;
    }

    if (target.closest("[data-action='copy-ai-prompt']")) {
      if (state.aiPrompt && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(state.aiPrompt).catch(() => {});
      }
      return;
    }

    if (target.closest("[data-theme-toggle]")) {
      state.theme = state.theme === "dark" ? "light" : "dark";
      render();
      return;
    }

    if (target.closest("[data-clear-events]")) {
      state.events = [];
      state.eventCount = 0;
      state.timelineCursor = -1;
      state.selectedMetaKey = null;
      state.aiPrompt = null;
      state.aiLikelyCause = null;
      state.aiStatus = "idle";
      state.aiResponse = null;
      state.aiError = null;
      aiRequestToken += 1;
      render();
    }
  };

  const handleInput = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.timelineCursor !== "true") return;

    state.timelineCursor = Number(target.value);
    render();
  };

  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);

  render();

  return () => {
    unsubDebug();
    unsubEventBus();
    root.removeEventListener("click", handleClick);
    root.removeEventListener("input", handleInput);
    root.innerHTML = "";
  };

  function render() {
    root.dataset.theme = state.theme;
    root.innerHTML = renderApp(state);
  }
}

function normalizeEvent(rawEvent: unknown): DevtoolsEvent | null {
  if (!rawEvent || typeof rawEvent !== "object") return null;

  const event = rawEvent as Record<string, unknown>;
  const type = typeof event.type === "string" ? event.type : null;
  const timestamp = typeof event.timestamp === "number" ? event.timestamp : Date.now();
  if (!type) return null;

  if (event.payload && typeof event.payload === "object") {
    return {
      type,
      timestamp,
      payload: event.payload as Record<string, unknown>,
      level: parseLevel(event.level),
      file: typeof event.file === "string" ? event.file : undefined,
      line: typeof event.line === "number" ? event.line : undefined,
      column: typeof event.column === "number" ? event.column : undefined
    };
  }

  const { payload: _payload, type: _type, timestamp: _timestamp, ...rest } = event;
  return {
    type,
    timestamp,
    payload: rest,
    level: parseLevel(event.level),
    file: typeof event.file === "string" ? event.file : undefined,
    line: typeof event.line === "number" ? event.line : undefined,
    column: typeof event.column === "number" ? event.column : undefined
  };
}

function parseLevel(level: unknown): DevtoolsEvent["level"] {
  if (level === "info" || level === "warn" || level === "error") return level;
  return undefined;
}

function renderApp(state: DevtoolsState): string {
  return `
    <div class="devtools-shell">
      <div class="devtools-header">
        <div>
          <div class="devtools-title">Terajs DevTools</div>
          <div class="devtools-subtitle">Events: ${state.eventCount}</div>
        </div>
        <button class="toolbar-button" data-theme-toggle="true">${state.theme === "dark" ? "Light Theme" : "Dark Theme"}</button>
      </div>
      <div class="devtools-body">
        <div class="devtools-tabs">
          ${TABS.map((tab) => `
            <button class="tab-button ${state.activeTab === tab ? "is-active" : ""}" data-tab="${escapeHtml(tab)}">${escapeHtml(tab)}</button>
          `).join("")}
        </div>
        <div class="devtools-panel">
          ${renderPanel(state)}
        </div>
      </div>
    </div>
  `;
}

function renderPanel(state: DevtoolsState): string {
  switch (state.activeTab) {
    case "Components":
      return renderComponentsPanel(state.events);
    case "AI Diagnostics":
      return renderAIDiagnosticsPanel(state);
    case "Signals":
      return renderSignalsPanel(state.events);
    case "Meta":
      return renderMetaPanel(state);
    case "Issues":
      return renderIssuesPanel(state.events);
    case "Logs":
      return renderLogsPanel(state);
    case "Timeline":
      return renderTimelinePanel(state);
    case "Queue":
      return renderQueuePanel(state.events);
    case "Performance":
      return renderPerformancePanel(state.events);
    case "Sanity Check":
      return renderSanityPanel(state.events);
    case "Settings":
      return renderSettingsPanel();
  }
}

function renderComponentsPanel(events: DevtoolsEvent[]): string {
  const components = collectComponents(events);
  if (components.length === 0) {
    return renderEmptyPanel("Component Tree", "Live component instances", "No components mounted.");
  }

  return `
    <div>
      <div class="panel-title is-blue">Component Tree</div>
      <div class="panel-subtitle">Live component instances</div>
      <ul class="stack-list">
        ${components.map((component) => `
          <li class="stack-item">
            <div>
              <span class="accent-text is-green">${escapeHtml(component.scope)}</span>
              <span class="muted-text">#${component.instance}</span>
            </div>
            ${component.aiPreview ? `<div class="muted-text ai-hint">AI Context: ${escapeHtml(component.aiPreview)}</div>` : ""}
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

function renderSignalsPanel(events: DevtoolsEvent[]): string {
  const updates = collectSignalUpdates(events);
  const effectRuns = events.filter((event) => event.type === "effect:run").length;

  if (updates.length === 0) {
    return `
      <div>
        <div class="panel-title is-purple">Signal and Effect Inspector</div>
        <div class="panel-subtitle">Effects run: ${effectRuns}</div>
        <div class="empty-state">No signal updates yet.</div>
      </div>
    `;
  }

  return `
    <div>
      <div class="panel-title is-purple">Signal and Effect Inspector</div>
      <div class="panel-subtitle">Effects run: ${effectRuns}</div>
      <ul class="stack-list">
        ${updates.map((update) => `
          <li class="stack-item">
            <span class="accent-text is-cyan">${escapeHtml(update.key)}</span>
            <span class="muted-text">= ${escapeHtml(update.preview)}</span>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

function renderMetaPanel(state: DevtoolsState): string {
  const entries = collectMetaEntries(state.events);
  const selected = entries.find((entry) => entry.key === state.selectedMetaKey) ?? entries[0] ?? null;

  if (entries.length === 0) {
    return `
      <div>
        <div class="panel-title is-green">Meta / AI / Route Inspector</div>
        <div class="panel-subtitle">Metadata currently available on the debug stream</div>
        <div class="empty-state">No component metadata has been observed yet.</div>
      </div>
    `;
  }

  return `
    <div>
      <div class="panel-title is-green">Meta / AI / Route Inspector</div>
      <div class="panel-subtitle">Components with metadata: ${entries.length}</div>
      <ul class="stack-list compact-list">
        ${entries.map((entry) => `
          <li>
            <button class="select-button ${selected?.key === entry.key ? "is-selected" : ""}" data-meta-key="${escapeHtml(entry.key)}">
              <span class="accent-text is-green">${escapeHtml(entry.scope)}</span>
              <span class="muted-text">#${entry.instance}</span>
            </button>
          </li>
        `).join("")}
      </ul>
      <div class="detail-card">
        <div><span class="accent-text is-green">Meta:</span> ${escapeHtml(shortJson(selected?.meta ?? {}))}</div>
        <div><span class="accent-text is-green">AI:</span> ${escapeHtml(shortJson(selected?.ai ?? {}))}</div>
        <div><span class="accent-text is-green">Route:</span> ${escapeHtml(shortJson(selected?.route ?? {}))}</div>
      </div>
    </div>
  `;
}

function renderIssuesPanel(events: DevtoolsEvent[]): string {
  const issues = events.filter((event) =>
    event.type.startsWith("error:") ||
    event.type.includes("warn") ||
    event.type.includes("hydration") ||
    event.level === "error" ||
    event.level === "warn"
  );

  const errorCount = issues.filter((event) => event.level === "error" || event.type.startsWith("error:")).length;
  const warnCount = issues.filter((event) => event.level === "warn" || event.type.includes("warn")).length;

  if (issues.length === 0) {
    return `
      <div>
        <div class="panel-title is-red">Issues and Warnings</div>
        <div class="panel-subtitle">Errors: 0 | Warnings: 0</div>
        <div class="empty-state">No issues detected.</div>
      </div>
    `;
  }

  return `
    <div>
      <div class="panel-title is-red">Issues and Warnings</div>
      <div class="panel-subtitle">Errors: ${errorCount} | Warnings: ${warnCount}</div>
      <ul class="stack-list">
        ${issues.slice(-50).map((issue) => `
          <li class="stack-item ${issue.level === "error" || issue.type.startsWith("error:") ? "issue-error" : "issue-warn"}">
            <span class="item-label">[${escapeHtml(issue.type)}]</span>
            <span>${escapeHtml(issueMessage(issue))}</span>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

function renderLogsPanel(state: DevtoolsState): string {
  const logs = state.events.slice(-100).filter((event) => {
    if (state.logFilter === "all") return true;
    return event.type.includes(state.logFilter);
  });

  return `
    <div>
      <div class="panel-title is-blue">Event Logs</div>
      <div class="panel-subtitle">Total events: ${state.events.length}</div>
      <div class="button-row">
        ${(["all", "component", "signal", "effect", "error", "hub"] as const).map((filter) => `
          <button class="filter-button ${state.logFilter === filter ? "is-active" : ""}" data-log-filter="${filter}">${filter}</button>
        `).join("")}
      </div>
      ${logs.length === 0 ? `<div class="empty-state">No events.</div>` : `
        <ul class="stack-list log-list">
          ${logs.map((log) => `
            <li class="stack-item">
              <span class="accent-text is-cyan">[${escapeHtml(log.type)}]</span>
              <span>${escapeHtml(summarizeLog(log))}</span>
            </li>
          `).join("")}
        </ul>
      `}
    </div>
  `;
}

function renderTimelinePanel(state: DevtoolsState): string {
  const timeline = buildTimeline(state.events, 250);
  const cursor = timeline.length === 0 ? -1 : Math.max(0, Math.min(state.timelineCursor, timeline.length - 1));
  const replayedCount = timeline.length === 0 ? 0 : replayEventsAtIndex(timeline, cursor).length;

  return `
    <div>
      <div class="panel-title is-green">Timeline and Replay</div>
      <div class="panel-subtitle">Replaying ${replayedCount} / ${timeline.length} events</div>
      ${timeline.length > 0 ? `
        <div class="range-wrap">
          <input class="timeline-slider" type="range" min="0" max="${Math.max(0, timeline.length - 1)}" value="${Math.max(0, cursor)}" data-timeline-cursor="true" />
          <div class="tiny-muted">Cursor: ${cursor}</div>
        </div>
      ` : ""}
      ${timeline.length === 0 ? `<div class="empty-state">No events in timeline.</div>` : `
        <ul class="stack-list log-list">
          ${timeline.map((entry, index) => `
            <li class="stack-item ${index <= cursor ? "timeline-active" : "timeline-inactive"}">
              <span class="item-label">[${escapeHtml(entry.type)}]</span>
              <span>${escapeHtml(entry.summary)}</span>
            </li>
          `).join("")}
        </ul>
      `}
    </div>
  `;
}

function renderPerformancePanel(events: DevtoolsEvent[]): string {
  const metrics = computePerformanceMetrics(events, 10000);

  return `
    <div>
      <div class="panel-title is-amber">Performance</div>
      <div class="metrics-grid">
        ${renderMetricCard("Events (10s)", String(metrics.totalEvents))}
        ${renderMetricCard("Events / sec", String(metrics.updatesPerSecond))}
        ${renderMetricCard("Effect Runs", String(metrics.effectRuns))}
        ${renderMetricCard("Render Events", String(metrics.renderEvents))}
        ${renderMetricCard("Queue Enqueued", String(metrics.queueEnqueued))}
        ${renderMetricCard("Queue Conflicts", String(metrics.queueConflicts))}
        ${renderMetricCard("Queue Retried", String(metrics.queueRetried))}
        ${renderMetricCard("Queue Failed", String(metrics.queueFailed))}
        ${renderMetricCard("Queue Flushed", String(metrics.queueFlushed))}
        ${renderMetricCard("Queue Depth Est.", String(metrics.queueDepthEstimate))}
        ${renderMetricCard("Hub Connects", String(metrics.hubConnections))}
        ${renderMetricCard("Hub Disconnects", String(metrics.hubDisconnections))}
        ${renderMetricCard("Hub Errors", String(metrics.hubErrors))}
        ${renderMetricCard("Hub Push", String(metrics.hubPushReceived))}
      </div>
      <div class="panel-subtitle">Hot event types: ${metrics.hotTypes.length === 0 ? "none" : escapeHtml(metrics.hotTypes.join(", "))}</div>
      ${metrics.byType.length === 0 ? `<div class="empty-state">No performance data yet.</div>` : `
        <ul class="stack-list log-list">
          ${metrics.byType.slice(0, 20).map((item) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-amber">${escapeHtml(item.type)}</span>
              <span class="muted-text">count=${item.count}</span>
              <span class="muted-text">avg=${item.avgDeltaMs}ms</span>
              <span class="muted-text">max=${item.maxDeltaMs}ms</span>
            </li>
          `).join("")}
        </ul>
      `}
    </div>
  `;
}

function renderQueuePanel(events: DevtoolsEvent[]): string {
  const metrics = computePerformanceMetrics(events, 10000);
  const queueEvents = events
    .filter((event) => event.type.startsWith("queue:"))
    .slice(-80)
    .reverse();

  return `
    <div>
      <div class="panel-title is-amber">Queue Monitor</div>
      <div class="panel-subtitle">Pending estimate: ${metrics.queueDepthEstimate} | Enqueued: ${metrics.queueEnqueued}</div>
      <div class="metrics-grid">
        ${renderMetricCard("Queue Enqueued", String(metrics.queueEnqueued))}
        ${renderMetricCard("Queue Conflicts", String(metrics.queueConflicts))}
        ${renderMetricCard("Queue Retried", String(metrics.queueRetried))}
        ${renderMetricCard("Queue Failed", String(metrics.queueFailed))}
        ${renderMetricCard("Queue Flushed", String(metrics.queueFlushed))}
        ${renderMetricCard("Queue Depth Est.", String(metrics.queueDepthEstimate))}
      </div>
      ${queueEvents.length === 0 ? `<div class="empty-state">No queue events yet.</div>` : `
        <ul class="stack-list log-list">
          ${queueEvents.map((event) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-amber">${escapeHtml(event.type)}</span>
              <span class="muted-text">${escapeHtml(queueEventSummary(event))}</span>
            </li>
          `).join("")}
        </ul>
      `}
    </div>
  `;
}

function renderSanityPanel(events: DevtoolsEvent[]): string {
  const metrics = computeSanityMetrics(events, {
    ...DEFAULT_SANITY_THRESHOLDS,
    debugListenerCount: getDebugListenerCount()
  });

  const criticalCount = metrics.alerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = metrics.alerts.filter((alert) => alert.severity === "warning").length;

  return `
    <div>
      <div class="panel-title is-red">Sanity Check</div>
      <div class="panel-subtitle">Critical: ${criticalCount} | Warnings: ${warningCount}</div>
      <div class="metrics-grid">
        ${renderMetricCard("Active Effects", String(metrics.activeEffects))}
        ${renderMetricCard("Effect Creates", String(metrics.effectCreates))}
        ${renderMetricCard("Effect Disposes", String(metrics.effectDisposes))}
        ${renderMetricCard("Effect Runs / sec", String(metrics.effectRunsPerSecond))}
        ${renderMetricCard("Effect Imbalance", String(metrics.effectImbalance))}
        ${renderMetricCard("Debug Listeners", String(metrics.debugListenerCount))}
      </div>
      ${metrics.alerts.length === 0 ? `<div class="empty-state">No runaway effects or listener leaks detected in the active window.</div>` : `
        <ul class="stack-list">
          ${metrics.alerts.map((alert) => `
            <li class="stack-item ${alert.severity === "critical" ? "issue-error" : "issue-warn"}">
              <span class="item-label">[${escapeHtml(alert.severity.toUpperCase())}]</span>
              <span>${escapeHtml(alert.message)}</span>
              <span class="muted-text">current=${escapeHtml(String(alert.current))}, threshold=${escapeHtml(String(alert.threshold))}</span>
            </li>
          `).join("")}
        </ul>
      `}
    </div>
  `;
}

function renderSettingsPanel(): string {
  return `
    <div>
      <div class="panel-title is-purple">Devtools Settings</div>
      <div class="detail-card">
        <div>This public overlay now mounts the real event-driven UI path.</div>
        <div class="muted-text">Theme toggle and event reset are available here while the richer SFC package continues to evolve.</div>
      </div>
      <div class="button-row">
        <button class="toolbar-button danger-button" data-clear-events="true">Clear All Events</button>
      </div>
    </div>
  `;
}

function renderAIDiagnosticsPanel(state: DevtoolsState): string {
  const aiStatusLabel = state.aiStatus === "loading"
    ? "Querying assistant..."
    : state.aiStatus === "ready"
    ? "Response ready"
    : state.aiStatus === "error"
    ? "Assistant unavailable"
    : "Prompt-only mode";

  return `
    <div class="ai-panel">
      <div class="panel-title is-purple">AI Diagnostics</div>
      <div class="panel-subtitle">Snapshot-driven context and likely cause insights</div>
      <div class="button-row">
        <button class="toolbar-button ask-ai-button" data-action="ask-ai">Ask Terajs AI</button>
        <button class="toolbar-button" data-action="copy-ai-prompt">Copy Prompt</button>
      </div>
      <div class="detail-card">
        <div><span class="accent-text is-purple">Assistant Status:</span> ${escapeHtml(aiStatusLabel)}</div>
        <div><span class="accent-text is-purple">Current AI Insight:</span> ${escapeHtml(state.aiLikelyCause ?? "No reactive error detected yet.")}</div>
      </div>
      ${state.aiStatus === "loading" ? `
        <div class="empty-state">Consulting configured assistant provider...</div>
      ` : ""}
      ${state.aiError ? `
        <div class="detail-card issue-error">
          <div class="accent-text is-red">${escapeHtml(state.aiError)}</div>
        </div>
      ` : ""}
      ${state.aiResponse ? `
        <div class="detail-card">
          <div class="panel-subtitle">Assistant Response</div>
          <pre class="ai-response">${escapeHtml(state.aiResponse)}</pre>
        </div>
      ` : ""}
      ${state.aiPrompt ? `
        <div class="detail-card">
          <div class="panel-subtitle">AI Prompt</div>
          <pre class="ai-prompt">${escapeHtml(state.aiPrompt)}</pre>
        </div>
      ` : `
        <div class="empty-state">Click "Ask Terajs AI" to build a prompt from the active keyed signal registry.</div>
      `}
    </div>
  `;
}

function renderMetricCard(label: string, value: string): string {
  return `
    <div class="metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderEmptyPanel(title: string, subtitle: string, message: string): string {
  return `
    <div>
      <div class="panel-title is-blue">${escapeHtml(title)}</div>
      <div class="panel-subtitle">${escapeHtml(subtitle)}</div>
      <div class="empty-state">${escapeHtml(message)}</div>
    </div>
  `;
}

function collectComponents(events: DevtoolsEvent[]) {
  const componentMap = new Map<string, { key: string; scope: string; instance: number; aiPreview?: string }>();

  for (const event of events) {
    if (event.type !== "component:mounted") continue;
    const scope = readString(event.payload, "scope") ?? readString(event.payload, "name") ?? "unknown";
    const instance = readNumber(event.payload, "instance") ?? readNumber(event.payload, "id") ?? event.timestamp;
    const ai = readUnknown(event.payload, "ai");
    const aiPreview = ai !== undefined ? safeString(ai).slice(0, 160) : undefined;
    const key = `${scope}#${instance}`;
    componentMap.set(key, { key, scope, instance, aiPreview });
  }

  return Array.from(componentMap.values());
}

function collectSignalUpdates(events: DevtoolsEvent[]) {
  const signalMap = new Map<string, { key: string; preview: string }>();

  for (const event of events) {
    if (!isSignalLikeUpdate(event.type)) continue;
    const key = readString(event.payload, "key") ?? readString(event.payload, "rid") ?? event.type;
    const previewValue =
      readUnknown(event.payload, "next") ??
      readUnknown(event.payload, "value") ??
      readUnknown(event.payload, "newValue") ??
      readUnknown(event.payload, "prev") ??
      readUnknown(event.payload, "initialValue");

    signalMap.set(key, {
      key,
      preview: safeString(previewValue).slice(0, 60)
    });
  }

  return Array.from(signalMap.values());
}

function collectMetaEntries(events: DevtoolsEvent[]) {
  const metaMap = new Map<string, {
    key: string;
    scope: string;
    instance: number;
    meta: unknown;
    ai: unknown;
    route: unknown;
  }>();

  for (const event of events) {
    if (event.type === "component:mounted") {
      const scope = readString(event.payload, "scope") ?? readString(event.payload, "name") ?? "unknown";
      const instance = readNumber(event.payload, "instance") ?? readNumber(event.payload, "id") ?? event.timestamp;
      const meta = readUnknown(event.payload, "meta");
      const ai = readUnknown(event.payload, "ai");
      const route = readUnknown(event.payload, "route");
      if (meta === undefined && ai === undefined && route === undefined) continue;
      const key = `${scope}#${instance}`;
      metaMap.set(key, { key, scope, instance, meta, ai, route });
      continue;
    }

    if (event.type === "route:meta:resolved") {
      const target = readString(event.payload, "to") ?? "current-route";
      const meta = readUnknown(event.payload, "meta");
      const ai = readUnknown(event.payload, "ai");
      const route = readUnknown(event.payload, "route");
      const key = `route:${target}`;
      metaMap.set(key, {
        key,
        scope: `Route ${target}`,
        instance: event.timestamp,
        meta,
        ai,
        route
      });
    }
  }

  return Array.from(metaMap.values());
}

function summarizeLog(event: DevtoolsEvent): string {
  const payload = event.payload ?? {};
  const scope = readString(payload, "scope") ?? readString(payload, "name");
  const message = readString(payload, "message");
  if (message) return message;
  if (scope) return scope;
  return shortJson(payload);
}

function issueMessage(event: DevtoolsEvent): string {
  const message = readString(event.payload, "message");
  if (message) return message;
  const likelyCause = readString(event.payload, "likelyCause");
  if (likelyCause) return `Likely Cause: ${likelyCause}`;
  return shortJson(event.payload ?? {});
}

function queueEventSummary(event: DevtoolsEvent): string {
  const payload = event.payload ?? {};
  const id = readString(payload, "id");
  const type = readString(payload, "type");
  const decision = readString(payload, "decision");
  const attempts = readNumber(payload, "attempts");
  const pending = readNumber(payload, "pending");

  const parts = [
    type ? `type=${type}` : undefined,
    id ? `id=${id}` : undefined,
    decision ? `decision=${decision}` : undefined,
    attempts !== undefined ? `attempts=${attempts}` : undefined,
    pending !== undefined ? `pending=${pending}` : undefined
  ].filter((part): part is string => typeof part === "string");

  return parts.length > 0 ? parts.join(" ") : shortJson(payload);
}

function generateLikelyCause(payload: Record<string, unknown> | undefined): string | null {
  const snapshot = captureStateSnapshot();
  const entries = snapshot.signals.map((signal) => `${signal.key ?? signal.id}: ${safeString(signal.value)}`);
  const topEntries = entries.slice(0, 4).join("; ");
  const origin = readString(payload, "rid") ?? readString(payload, "scope") ?? "unknown origin";
  const message = readString(payload, "message") ?? "reactive error detected";

  return `Detected reactive error (${message}) from ${origin}. Current keyed state: ${topEntries || "no keyed signals available"}.`;
}

function normalizeAIAssistantOptions(options?: DevtoolsAIAssistantOptions): NormalizedAIAssistantOptions {
  const endpoint = typeof options?.endpoint === "string" && options.endpoint.trim().length > 0
    ? options.endpoint.trim()
    : null;

  const model = typeof options?.model === "string" && options.model.trim().length > 0
    ? options.model.trim()
    : "terajs-assistant";

  const timeoutMs = typeof options?.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
    ? Math.min(60000, Math.max(1500, Math.round(options.timeoutMs)))
    : 12000;

  return {
    enabled: options?.enabled !== false,
    endpoint,
    model,
    timeoutMs
  };
}

function getGlobalAIAssistantHook(): AIAssistantHook | null {
  if (typeof globalThis !== "object" || globalThis === null) {
    return null;
  }

  const maybeHook = (globalThis as typeof globalThis & {
    __TERAJS_AI_ASSISTANT__?: unknown;
  }).__TERAJS_AI_ASSISTANT__;

  return typeof maybeHook === "function" ? maybeHook as AIAssistantHook : null;
}

async function resolveAIAssistantResponse(
  request: AIAssistantRequest,
  options: NormalizedAIAssistantOptions
): Promise<string> {
  const globalHook = getGlobalAIAssistantHook();
  if (globalHook) {
    const response = await globalHook(request);
    return extractAIAssistantResponseText(response);
  }

  if (!options.endpoint) {
    throw new Error("No AI assistant provider is configured. Set devtools.ai.endpoint or provide window.__TERAJS_AI_ASSISTANT__. ");
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs);

  try {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: options.model,
        prompt: request.prompt,
        snapshot: request.snapshot,
        sanity: request.sanity,
        events: request.events
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`AI endpoint returned ${response.status}.`);
    }

    const rawText = await response.text();
    if (!rawText.trim()) {
      return "AI endpoint returned an empty response body.";
    }

    try {
      const parsed = JSON.parse(rawText) as unknown;
      return extractAIAssistantResponseText(parsed);
    } catch {
      return rawText;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`AI request timed out after ${options.timeoutMs}ms.`);
    }

    throw error instanceof Error ? error : new Error("AI request failed.");
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function extractAIAssistantResponseText(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "AI assistant returned an empty string.";
  }

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;

    const direct = payload.response ?? payload.content ?? payload.answer ?? payload.output_text;
    if (typeof direct === "string" && direct.trim().length > 0) {
      return direct;
    }

    const choices = payload.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0] as Record<string, unknown>;
      const message = first?.message as Record<string, unknown> | undefined;
      const content = message?.content;
      if (typeof content === "string" && content.trim().length > 0) {
        return content;
      }

      const text = first?.text;
      if (typeof text === "string" && text.trim().length > 0) {
        return text;
      }
    }
  }

  return shortJson(value);
}

function isSignalLikeUpdate(type: string): boolean {
  return (
    type === "signal:update" ||
    type === "state:update" ||
    type === "reactive:updated" ||
    type === "reactive:update" ||
    type === "ref:set" ||
    type === "computed:update"
  );
}

function readString(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = record?.[key];
  return typeof value === "number" ? value : undefined;
}

function readUnknown(record: Record<string, unknown> | undefined, key: string): unknown {
  return record?.[key];
}

function shortJson(value: unknown): string {
  return safeString(value).slice(0, 120);
}

function safeString(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
