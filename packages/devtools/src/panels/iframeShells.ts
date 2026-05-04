import { escapeHtml } from "../inspector/shared.js";
import {
  type DevtoolsIconName,
  renderDevtoolsHeadingRow,
  renderDevtoolsTitleRow,
} from "../devtoolsIcons.js";

export interface IframeNavItem {
  title: string;
  summary: string;
  iconName?: DevtoolsIconName;
  active?: boolean;
  attributes?: Record<string, string>;
}

interface IframeSplitPanelOptions {
  className?: string;
  navAriaLabel: string;
  navMarkup: string;
  detailAriaLabel: string;
  title: string;
  subtitle: string;
  body: string;
}

interface IframeSinglePanelOptions {
  className?: string;
  ariaLabel: string;
  title: string;
  subtitle: string;
  titleToneClass?: string;
  subtitleToneClass?: string;
  body: string;
}

interface IframeWorkbenchOptions {
  className?: string;
  sidebarAriaLabel: string;
  sidebarTitle: string;
  sidebarSubtitle: string;
  sidebarToolbar?: string;
  sidebarBody: string;
  detailAriaLabel: string;
  detailTitle: string;
  detailSubtitle: string;
  detailToolbar?: string;
  detailBody: string;
}

interface IframeComponentsScreenOptions {
  className?: string;
  treeAriaLabel: string;
  treeToolbar?: string;
  treeBody: string;
  detailAriaLabel: string;
  detailTitle: string;
  detailSubtitle: string;
  detailToolbar?: string;
  detailBody: string;
  detailVisible?: boolean;
  detailHeaderVisible?: boolean;
  detailIconName?: DevtoolsIconName;
  detailToneClass?: string;
}

export interface WorkbenchListItem {
  title: string;
  summary?: string;
  meta?: string;
  badge?: string;
  iconName?: DevtoolsIconName;
  active?: boolean;
  tone?: "neutral" | "warn" | "error";
  group?: string;
  attributes?: Record<string, string>;
}

export interface WorkbenchMetric {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "error" | "accent";
}

interface WorkbenchIntroOptions {
  title: string;
  titleToneClass?: string;
  description: string;
  metrics?: readonly WorkbenchMetric[];
  steps?: readonly string[];
  note?: string;
}

interface WorkbenchDisclosureOptions {
  label: string;
  title: string;
  subtitle?: string;
  body: string;
}

interface InvestigationJournalOptions {
  className?: string;
  ariaLabel: string;
  title: string;
  subtitle: string;
  titleToneClass?: string;
  subtitleToneClass?: string;
  heroKicker?: string;
  heroTitle: string;
  heroSummary: string;
  heroMetrics?: readonly WorkbenchMetric[];
  toolbar?: string;
  feedAriaLabel: string;
  feedTitle: string;
  feedSubtitle: string;
  feedTitleToneClass?: string;
  feedSubtitleToneClass?: string;
  feedBody: string;
  detailAriaLabel: string;
  detailTitle: string;
  detailSubtitle: string;
  detailTitleToneClass?: string;
  detailSubtitleToneClass?: string;
  detailBody: string;
}

function renderAttributes(attributes: Record<string, string> | undefined): string {
  if (!attributes) {
    return "";
  }

  return Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join("");
}

export function renderIframeNavList(items: readonly IframeNavItem[]): string {
  return `
    <div class="ai-diagnostics-nav-list">
      ${items.map((item) => `
        <button
          class="ai-diagnostics-nav-button ${item.active ? "is-active" : ""}"
          type="button"
          ${renderAttributes(item.attributes)}
        >
          <span class="ai-diagnostics-nav-title">${escapeHtml(item.title)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

export function renderIframeSplitPanel(options: IframeSplitPanelOptions): string {
  return `
    <div class="ai-diagnostics-layout ${options.className ?? ""}">
      <aside class="components-tree-pane ai-diagnostics-nav-pane" aria-label="${escapeHtml(options.navAriaLabel)}">
        <div class="components-screen-body">
          ${options.navMarkup}
        </div>
      </aside>

      <section class="components-inspector-pane ai-diagnostics-detail-pane" aria-label="${escapeHtml(options.detailAriaLabel)}">
        <div class="components-screen-header">
          <div class="components-screen-header-row">
            <div>
              ${renderDevtoolsTitleRow(options.title, "is-cyan")}
              <div class="panel-subtitle">${escapeHtml(options.subtitle)}</div>
            </div>
          </div>
        </div>
        <div class="components-screen-body">
          <div class="iframe-panel-stack">
            ${options.body}
          </div>
        </div>
      </section>
    </div>
  `;
}

export function renderIframeWorkbench(options: IframeWorkbenchOptions): string {
  return `
    <div class="devtools-workbench ${options.className ?? ""}">
      <aside class="devtools-workbench-sidebar" aria-label="${escapeHtml(options.sidebarAriaLabel)}">
        <div class="devtools-workbench-header devtools-workbench-sidebar-header">
          <div class="devtools-workbench-title">${escapeHtml(options.sidebarTitle)}</div>
          <div class="devtools-workbench-subtitle">${escapeHtml(options.sidebarSubtitle)}</div>
          ${options.sidebarToolbar ? `<div class="devtools-workbench-toolbar">${options.sidebarToolbar}</div>` : ""}
        </div>
        <div class="devtools-workbench-sidebar-body">
          ${options.sidebarBody}
        </div>
      </aside>

      <section class="devtools-workbench-main" aria-label="${escapeHtml(options.detailAriaLabel)}">
        <div class="devtools-workbench-header devtools-workbench-main-header">
          <div class="devtools-workbench-title">${escapeHtml(options.detailTitle)}</div>
          <div class="devtools-workbench-subtitle">${escapeHtml(options.detailSubtitle)}</div>
          ${options.detailToolbar ? `<div class="devtools-workbench-toolbar">${options.detailToolbar}</div>` : ""}
        </div>
        <div class="devtools-workbench-main-body">
          <div class="iframe-panel-stack">
            ${options.detailBody}
          </div>
        </div>
      </section>
    </div>
  `;
}

export function renderIframeComponentsScreen(options: IframeComponentsScreenOptions): string {
  const detailVisible = options.detailVisible ?? true;
  const detailHeaderVisible = options.detailHeaderVisible ?? true;

  return `
    <div class="components-screen components-screen--iframe ${detailVisible ? "" : "is-inspector-hidden"} ${options.className ?? ""}">
      <section class="components-screen-tree" aria-label="${escapeHtml(options.treeAriaLabel)}">
        ${options.treeToolbar ? `
          <div class="components-screen-header">
            <div class="components-screen-header-row">
              ${options.treeToolbar}
            </div>
          </div>
        ` : ""}
        <div class="components-screen-body">
          ${options.treeBody}
        </div>
      </section>
      ${detailVisible ? `
        <section class="components-screen-inspector" aria-label="${escapeHtml(options.detailAriaLabel)}">
          ${detailHeaderVisible ? `
            <div class="components-screen-header">
              <div class="components-screen-header-row">
                <div>
                  ${renderDevtoolsTitleRow(options.detailTitle, options.detailToneClass ?? "is-cyan", options.detailIconName)}
                  <div class="panel-subtitle">${escapeHtml(options.detailSubtitle)}</div>
                </div>
                ${options.detailToolbar ?? ""}
              </div>
            </div>
          ` : ""}
          <div class="components-screen-body">
            ${options.detailBody}
          </div>
        </section>
      ` : ""}
    </div>
  `;
}

export function renderWorkbenchList(items: readonly WorkbenchListItem[]): string {
  let previousGroup: string | undefined;

  return `
    <div class="devtools-workbench-list">
      ${items.map((item) => {
        const groupMarkup = item.group && item.group !== previousGroup
          ? `<div class="devtools-workbench-list-group">${escapeHtml(item.group)}</div>`
          : "";
        previousGroup = item.group;
        return `${groupMarkup}
          <button
            class="devtools-workbench-list-item ${item.active ? "is-active" : ""}${item.tone && item.tone !== "neutral" ? ` is-${item.tone}` : ""}"
            type="button"
            ${renderAttributes(item.attributes)}
          >
            <div class="devtools-workbench-list-item-title-row">
              <span class="devtools-workbench-list-item-title">${escapeHtml(item.title)}</span>
              ${item.badge ? `<span class="devtools-workbench-list-item-badge">${escapeHtml(item.badge)}</span>` : ""}
            </div>
          </button>`;
      }).join("")}
    </div>
  `;
}

export function renderWorkbenchFacts(facts: Array<{ label: string; value: string }>): string {
  return `
    <div class="devtools-workbench-facts">
      ${facts.map((fact) => `
        <div class="devtools-workbench-fact">
          <div class="devtools-workbench-fact-label">${escapeHtml(fact.label)}</div>
          <div class="devtools-workbench-fact-value">${escapeHtml(fact.value)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderWorkbenchMetrics(metrics: readonly WorkbenchMetric[]): string {
  if (metrics.length === 0) {
    return "";
  }

  return `
    <div class="devtools-workbench-metrics">
      ${metrics.map((metric) => `
        <div class="devtools-workbench-metric ${metric.tone ? `is-${metric.tone}` : ""}">
          <div class="devtools-workbench-metric-label">${escapeHtml(metric.label)}</div>
          <div class="devtools-workbench-metric-value">${escapeHtml(metric.value)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderWorkbenchIntroState(options: WorkbenchIntroOptions): string {
  const compactNote = options.note ?? options.description;

  return `
    <section class="devtools-workbench-intro">
      <div class="devtools-workbench-intro-title${options.titleToneClass ? ` ${options.titleToneClass}` : ""}">${escapeHtml(options.title)}</div>
      ${options.metrics?.length ? renderWorkbenchMetrics(options.metrics) : ""}
      ${compactNote ? `<div class="devtools-workbench-note">${escapeHtml(compactNote)}</div>` : ""}
    </section>
  `;
}

export function renderWorkbenchDisclosure(options: WorkbenchDisclosureOptions): string {
  return `
    <details class="devtools-workbench-disclosure">
      <summary class="devtools-workbench-disclosure-toggle">
        <span class="devtools-workbench-disclosure-label">${escapeHtml(options.label)}</span>
        <span class="devtools-workbench-disclosure-copy">
          <span class="devtools-workbench-disclosure-title">${escapeHtml(options.title)}</span>
          ${options.subtitle ? `<span class="devtools-workbench-disclosure-subtitle">${escapeHtml(options.subtitle)}</span>` : ""}
        </span>
      </summary>
      <div class="devtools-workbench-disclosure-panel">
        ${options.body}
      </div>
    </details>
  `;
}

export function renderIframeFlatSection(title: string, body: string, className = ""): string {
  return `
    <section class="iframe-panel-section-block ${className}">
      ${renderDevtoolsHeadingRow(title, "iframe-panel-section-heading")}
      ${body}
    </section>
  `;
}

export function renderIframeSinglePanel(options: IframeSinglePanelOptions): string {
  return `
    <section class="devtools-utility-panel iframe-single-panel ${options.className ?? ""}" aria-label="${escapeHtml(options.ariaLabel)}">
      <div class="devtools-utility-panel-header">
        <div class="devtools-workbench-title${options.titleToneClass ? ` ${options.titleToneClass}` : ""}">${escapeHtml(options.title)}</div>
        <div class="devtools-workbench-subtitle${options.subtitleToneClass ? ` ${options.subtitleToneClass}` : ""}">${escapeHtml(options.subtitle)}</div>
      </div>
      <div class="devtools-utility-panel-body">
        <div class="iframe-panel-stack">
          ${options.body}
        </div>
      </div>
    </section>
  `;
}

export function renderInvestigationJournal(options: InvestigationJournalOptions): string {
  return `
    <section class="devtools-utility-panel iframe-single-panel investigation-journal ${options.className ?? ""}" aria-label="${escapeHtml(options.ariaLabel)}">
      <div class="devtools-utility-panel-header">
        <div class="devtools-utility-panel-header-main">
          <div class="devtools-workbench-title${options.titleToneClass ? ` ${options.titleToneClass}` : ""}">${escapeHtml(options.title)}</div>
          <div class="devtools-workbench-subtitle${options.subtitleToneClass ? ` ${options.subtitleToneClass}` : ""}">${escapeHtml(options.subtitle)}</div>
        </div>
        ${options.toolbar ? `<div class="devtools-utility-panel-toolbar">${options.toolbar}</div>` : ""}
      </div>
      <div class="devtools-utility-panel-body">
        <div class="investigation-journal-shell">
          <div class="investigation-journal-grid">
            <section class="investigation-journal-feed" aria-label="${escapeHtml(options.feedAriaLabel)}">
              <div class="investigation-journal-section-header">
                <div class="investigation-journal-section-title${options.feedTitleToneClass ? ` ${options.feedTitleToneClass}` : ""}">${escapeHtml(options.feedTitle)}</div>
                <div class="investigation-journal-section-subtitle${options.feedSubtitleToneClass ? ` ${options.feedSubtitleToneClass}` : ""}">${escapeHtml(options.feedSubtitle)}</div>
              </div>
              ${options.feedBody}
            </section>

            <aside class="investigation-journal-detail" aria-label="${escapeHtml(options.detailAriaLabel)}">
              <div class="investigation-journal-section-header">
                <div class="investigation-journal-section-title${options.detailTitleToneClass ? ` ${options.detailTitleToneClass}` : ""}">${escapeHtml(options.detailTitle)}</div>
                <div class="investigation-journal-section-subtitle${options.detailSubtitleToneClass ? ` ${options.detailSubtitleToneClass}` : ""}">${escapeHtml(options.detailSubtitle)}</div>
              </div>
              <div class="iframe-panel-stack">
                ${options.detailBody}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  `;
}