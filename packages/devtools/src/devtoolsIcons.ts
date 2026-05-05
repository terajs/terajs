import { escapeHtml } from "./inspector/shared.js";

export type DevtoolsIconName =
  | "spark"
  | "bridge"
  | "inspect"
  | "components"
  | "ai"
  | "copy"
  | "signals"
  | "meta"
  | "issues"
  | "logs"
  | "timeline"
  | "router"
  | "queue"
  | "performance"
  | "sanity"
  | "settings"
  | "theme"
  | "minimize"
  | "maximize"
  | "fullscreen"
  | "restore"
  | "code";

const DEVTOOLS_ICON_MARKUP: Record<DevtoolsIconName, string> = {
  spark: '<path d="M12 3l1.8 4.6L18.5 9 13.8 10.4 12 15l-1.8-4.6L5.5 9l4.7-1.4L12 3Z"></path>',
  bridge: '<rect x="4.5" y="6" width="5" height="5" rx="1.2"></rect><rect x="14.5" y="6" width="5" height="5" rx="1.2"></rect><rect x="9.5" y="13" width="5" height="5" rx="1.2"></rect><path d="M9.5 8.5h5"></path><path d="M12 11v2"></path><path d="M9.5 15.5h5"></path>',
  inspect: '<circle cx="12" cy="12" r="6.2"></circle><circle cx="12" cy="12" r="2.3"></circle><path d="M12 3.5v3"></path><path d="M12 17.5v3"></path><path d="M3.5 12h3"></path><path d="M17.5 12h3"></path>',
  components: '<rect x="4.5" y="4.5" width="5.5" height="5.5" rx="1.4"></rect><rect x="14" y="4.5" width="5.5" height="5.5" rx="1.4"></rect><rect x="9.25" y="14" width="5.5" height="5.5" rx="1.4"></rect>',
  ai: '<path d="M12 3l1.5 3.9L17.5 8.5l-4 1.6L12 14l-1.5-3.9-4-1.6 4-1.6L12 3Z"></path><path d="M19 13.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z"></path><path d="M5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z"></path>',
  copy: '<rect x="9" y="9" width="10" height="11" rx="1.5"></rect><path d="M15 6.5V5A1.5 1.5 0 0 0 13.5 3.5H6A1.5 1.5 0 0 0 4.5 5v9A1.5 1.5 0 0 0 6 15.5h1.5"></path>',
  signals: '<path d="M3 13c2.5 0 2.5-6 5-6s2.5 10 5 10 2.5-6 5-6h3"></path>',
  meta: '<path d="M7 4.5h7l4 4V19.5H7z"></path><path d="M14 4.5v4h4"></path><path d="M9.5 12h6"></path><path d="M9.5 15.5h5"></path>',
  issues: '<path d="M12 4.5 20 19.5H4L12 4.5Z"></path><path d="M12 9.5v4.5"></path><path d="M12 17h.01"></path>',
  logs: '<path d="M6 7.5h12"></path><path d="M6 12h12"></path><path d="M6 16.5h12"></path><path d="M4.5 7.5h.01"></path><path d="M4.5 12h.01"></path><path d="M4.5 16.5h.01"></path>',
  timeline: '<circle cx="12" cy="12" r="7.5"></circle><path d="M12 8.5v4l2.8 1.8"></path>',
  router: '<path d="M5 6.5h7"></path><path d="M12 6.5 9.5 4"></path><path d="M12 6.5 9.5 9"></path><path d="M19 17.5h-7"></path><path d="M12 17.5 14.5 15"></path><path d="M12 17.5 14.5 20"></path><path d="M12 6.5v4.5"></path><path d="M12 12c0 2.1-1.7 3.8-3.8 3.8H7"></path>',
  queue: '<rect x="5" y="5" width="14" height="4" rx="1.5"></rect><rect x="5" y="10" width="14" height="4" rx="1.5"></rect><rect x="5" y="15" width="14" height="4" rx="1.5"></rect>',
  performance: '<path d="M5 16a7 7 0 1 1 14 0"></path><path d="M12 12l3.5-2"></path><path d="M12 16h.01"></path>',
  sanity: '<path d="M12 4 18 6.5v4.8c0 3.8-2.6 7.3-6 8.7-3.4-1.4-6-4.9-6-8.7V6.5L12 4Z"></path><path d="m9.4 12.2 1.8 1.8 3.8-4"></path>',
  settings: '<path d="M5 7.5h5"></path><path d="M14 7.5h5"></path><path d="M10 7.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path><path d="M5 16.5h8"></path><path d="M17 16.5h2"></path><path d="M13 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path>',
  theme: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2.75v2.1"></path><path d="M12 19.15v2.1"></path><path d="M4.75 4.75 6.2 6.2"></path><path d="M17.8 17.8 19.25 19.25"></path><path d="M2.75 12h2.1"></path><path d="M19.15 12h2.1"></path><path d="M4.75 19.25 6.2 17.8"></path><path d="M17.8 6.2 19.25 4.75"></path>',
  minimize: '<path d="M5 14.5h14"></path>',
  maximize: '<rect x="6" y="6.5" width="12" height="11" rx="1.2"></rect>',
  fullscreen: '<path d="M8 4.5H4.5V8"></path><path d="M16 4.5h3.5V8"></path><path d="M8 19.5H4.5V16"></path><path d="M16 19.5h3.5V16"></path>',
  restore: '<path d="M8 8.5h8v8H8z"></path><path d="M10.5 5.5h8v8"></path>',
  code: '<path d="m9 8-4 4 4 4"></path><path d="m15 8 4 4-4 4"></path><path d="m13 5-2 14"></path>'
};

const DEVTOOLS_ICON_RULES: Array<{ pattern: RegExp; icon: DevtoolsIconName }> = [
  { pattern: /bridge/i, icon: "ai" },
  { pattern: /copy|duplicate/i, icon: "copy" },
  { pattern: /component|state inspector|navigator/i, icon: "components" },
  { pattern: /signal|reactive|ref|effect/i, icon: "signals" },
  { pattern: /meta|document|head|allowlisted/i, icon: "meta" },
  { pattern: /issue|warning|error|alert|prompt input/i, icon: "issues" },
  { pattern: /log|event/i, icon: "logs" },
  { pattern: /timeline|replay|cursor|telemetry/i, icon: "timeline" },
  { pattern: /router|route/i, icon: "router" },
  { pattern: /queue/i, icon: "queue" },
  { pattern: /performance|metric|window metrics|avg|max|hot/i, icon: "performance" },
  { pattern: /sanity|lifecycle|listener/i, icon: "sanity" },
  { pattern: /setting|layout|dock|persist|session mode|theme|workspace/i, icon: "settings" },
  { pattern: /inspect|pick|select on page|crosshair/i, icon: "inspect" },
  { pattern: /ai|assistant|analysis|provider|prompt|copilot/i, icon: "ai" },
  { pattern: /code|source|file/i, icon: "code" }
];

interface HeadingRowOptions {
  iconName?: DevtoolsIconName;
  showIcon?: boolean;
}

export function resolveDevtoolsIconName(label: string, fallback: DevtoolsIconName = "spark"): DevtoolsIconName {
  for (const rule of DEVTOOLS_ICON_RULES) {
    if (rule.pattern.test(label)) {
      return rule.icon;
    }
  }

  return fallback;
}

export function renderDevtoolsIcon(name: DevtoolsIconName, className = ""): string {
  const classes = ["devtools-icon"];
  if (className.length > 0) {
    classes.push(className);
  }

  return `<span class="${classes.join(" ")}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${DEVTOOLS_ICON_MARKUP[name]}</svg></span>`;
}

export function renderDevtoolsTabLabel(title: string, compactLabel = title, iconName?: DevtoolsIconName): string {
  const resolvedIcon = iconName ?? resolveDevtoolsIconName(title);
  return `<span class="tab-button-content"><span class="devtools-icon-badge tab-button-icon-wrap">${renderDevtoolsIcon(resolvedIcon, "devtools-icon--md")}</span><span class="tab-button-label">${escapeHtml(compactLabel)}</span></span>`;
}

export function renderDevtoolsButtonLabel(label: string, _iconName?: DevtoolsIconName): string {
  return `<span class="toolbar-button-content"><span class="toolbar-button-label">${escapeHtml(label)}</span></span>`;
}

export function renderDevtoolsTitleRow(title: string, accentClass: string, _iconName?: DevtoolsIconName): string {
  return `<div class="devtools-title-row"><div class="panel-title ${accentClass}">${escapeHtml(title)}</div></div>`;
}

export function renderDevtoolsHeadingRow(title: string, className: string, options?: DevtoolsIconName | HeadingRowOptions): string {
  const normalizedOptions = typeof options === "string"
    ? { iconName: options, showIcon: false }
    : (options ?? {});
  const showIcon = normalizedOptions.showIcon === true;
  const resolvedIcon = normalizedOptions.iconName ?? resolveDevtoolsIconName(title);

  return `<div class="${className} devtools-heading-row${showIcon ? " has-icon" : ""}">${showIcon ? `<span class="devtools-icon-badge devtools-icon-badge--heading">${renderDevtoolsIcon(resolvedIcon, "devtools-icon--sm")}</span>` : ""}<span class="devtools-heading-text">${escapeHtml(title)}</span></div>`;
}

export function renderDevtoolsMetricLabel(label: string, _iconName?: DevtoolsIconName): string {
  return `<div class="metric-label metric-label-row"><span class="devtools-heading-text">${escapeHtml(label)}</span></div>`;
}