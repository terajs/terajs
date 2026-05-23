import { renderDevtoolsHeadingRow } from "../devtoolsIcons.js";
import { escapeHtml } from "../inspector/shared.js";
import {
  renderIframeSinglePanel,
  renderWorkbenchFacts,
  renderWorkbenchMetrics,
} from "./iframeShells.js";

export interface DiagnosticsFeedItem {
  title: string;
  summary?: string;
  meta?: string;
  badge?: string;
  tone?: "neutral" | "warn" | "error" | "accent";
}

export interface DiagnosticsDeckView<TView extends string> {
  key: TView;
  title: string;
  className: string;
  body: string;
}

export function renderDiagnosticsViewControls<TView extends string>(
  activeView: TView,
  ariaLabel: string,
  dataAttribute: string,
  views: Array<{ key: TView; label: string }>
): string {
  return `
    <div class="devtools-section-subcontrols" role="tablist" aria-label="${escapeHtml(ariaLabel)}">
      ${views.map((view) => `
        <button
          class="select-button select-button--compact ${activeView === view.key ? "is-selected" : ""}"
          type="button"
          ${dataAttribute}="${view.key}"
          role="tab"
          aria-selected="${activeView === view.key ? "true" : "false"}"
        >${escapeHtml(view.label)}</button>
      `).join("")}
    </div>
  `;
}

export function renderDiagnosticsFeed(items: readonly DiagnosticsFeedItem[], emptyMessage: string): string {
  if (items.length === 0) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <div class="diagnostics-feed">
      ${items.map((item) => `
        <article class="diagnostics-feed-item ${item.tone && item.tone !== "neutral" ? `is-${item.tone}` : ""}">
          <div class="diagnostics-feed-item-header">
            <div class="diagnostics-feed-item-title">${escapeHtml(item.title)}</div>
            ${item.badge ? `<span class="diagnostics-feed-item-badge">${escapeHtml(item.badge)}</span>` : ""}
          </div>
          ${item.summary ? `<div class="diagnostics-feed-item-summary">${escapeHtml(item.summary)}</div>` : ""}
          ${item.meta ? `<div class="diagnostics-feed-item-meta">${escapeHtml(item.meta)}</div>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

export function renderDiagnosticsSinglePanel<TView extends string>(options: {
  className: string;
  ariaLabel: string;
  title: string;
  subtitle: string;
  titleToneClass: string;
  subtitleToneClass: string;
  selectedView: DiagnosticsDeckView<TView>;
  controls: string;
}): string {
  return renderIframeSinglePanel({
    className: options.className,
    ariaLabel: options.ariaLabel,
    title: options.title,
    subtitle: options.subtitle,
    titleToneClass: options.titleToneClass,
    subtitleToneClass: options.subtitleToneClass,
    body: `
      <section class="iframe-panel-section-block ${options.selectedView.className}">
        <div class="devtools-section-subheader">
          ${renderDevtoolsHeadingRow(options.selectedView.title, "iframe-panel-section-heading")}
          ${options.controls}
        </div>
        ${options.selectedView.body}
      </section>
    `
  });
}

export { renderWorkbenchFacts, renderWorkbenchMetrics };