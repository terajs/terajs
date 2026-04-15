import { escapeHtml } from "../inspector/shared.js";

export interface IframeNavItem {
  title: string;
  summary: string;
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
  body: string;
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
          <span class="ai-diagnostics-nav-summary">${escapeHtml(item.summary)}</span>
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
              <div class="panel-title is-cyan">${escapeHtml(options.title)}</div>
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

export function renderIframeFlatSection(title: string, body: string, className = ""): string {
  return `
    <section class="iframe-panel-section-block ${className}">
      <div class="iframe-panel-section-heading">${escapeHtml(title)}</div>
      ${body}
    </section>
  `;
}

export function renderIframeSinglePanel(options: IframeSinglePanelOptions): string {
  return `
    <section class="components-inspector-pane iframe-single-panel ${options.className ?? ""}" aria-label="${escapeHtml(options.ariaLabel)}">
      <div class="components-screen-header">
        <div class="components-screen-header-row">
          <div>
            <div class="panel-title is-cyan">${escapeHtml(options.title)}</div>
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
  `;
}