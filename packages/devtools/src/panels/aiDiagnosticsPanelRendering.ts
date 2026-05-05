import {
  formatAIAssistantCodeReferenceLocation,
  type AIAssistantCodeReference,
  type AIAssistantStructuredResponse
} from "../aiHelpers.js";
import type { SafeDocumentContext } from "../documentContext.js";
import { escapeHtml } from "../inspector/shared.js";
import { renderDevtoolsButtonLabel, renderDevtoolsTitleRow, resolveDevtoolsIconName } from "../devtoolsIcons.js";
import {
  DEFAULT_AI_ANALYSIS_OUTPUT_VIEW,
  type AIAnalysisOutputView,
  type AIDocumentContextView,
  type AIDiagnosticsSectionKey,
  type AISessionModeView
} from "./aiDiagnosticsModel.js";

interface AIAnalysisOutputViewDefinition {
  key: AIAnalysisOutputView;
  label: string;
  title: string;
  toneClass: "is-cyan" | "is-blue" | "is-purple";
  iconName: "ai" | "code" | "issues";
  content: string;
}

export function renderAIDocumentContextViewControls(activeView: AIDocumentContextView): string {
  const views: Array<{ key: AIDocumentContextView; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "meta-tags", label: "Meta Tags" },
    { key: "head-links", label: "Head Links" }
  ];

  return `
    <div class="ai-section-subcontrols" role="tablist" aria-label="Document context views">
      ${views.map((view) => `
        <button
          class="select-button select-button--compact ${activeView === view.key ? "is-selected" : ""}"
          data-ai-document-context-view="${view.key}"
          type="button"
          role="tab"
          aria-selected="${activeView === view.key ? "true" : "false"}"
        >${renderDevtoolsButtonLabel(view.label)}</button>
      `).join("")}
    </div>
  `;
}

export function renderAISessionModeViewControls(activeView: AISessionModeView): string {
  const views: Array<{ key: AISessionModeView; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "coverage", label: "Coverage" }
  ];

  return `
    <div class="ai-section-subcontrols" role="tablist" aria-label="Session mode views">
      ${views.map((view) => `
        <button
          class="select-button select-button--compact ${activeView === view.key ? "is-selected" : ""}"
          data-ai-session-mode-view="${view.key}"
          type="button"
          role="tab"
          aria-selected="${activeView === view.key ? "true" : "false"}"
        >${renderDevtoolsButtonLabel(view.label)}</button>
      `).join("")}
    </div>
  `;
}

function renderAIAnalysisOutputViewControls(
  views: readonly AIAnalysisOutputViewDefinition[],
  activeView: AIAnalysisOutputView
): string {
  if (views.length < 2) {
    return "";
  }

  return `
    <div class="ai-section-subcontrols" role="tablist" aria-label="AI analysis views">
      ${views.map((view) => `
        <button
          class="select-button select-button--compact ${activeView === view.key ? "is-selected" : ""}"
          data-ai-analysis-output-view="${view.key}"
          type="button"
          role="tab"
          aria-selected="${activeView === view.key ? "true" : "false"}"
        >${renderDevtoolsButtonLabel(view.label)}</button>
      `).join("")}
    </div>
  `;
}

export function renderDocumentContextOverview(documentContext: SafeDocumentContext): string {
  return renderAIKeyValueList([
    { key: "Title present:", value: documentContext.title ? "Yes" : "No" },
    { key: "Meta tags:", value: String(documentContext.metaTags.length) },
    { key: "Head links:", value: String(documentContext.linkTags.length) },
    { key: "Query keys:", value: String(documentContext.queryKeys.length) },
    { key: "Title:", value: documentContext.title || "Untitled document" },
    { key: "Path:", value: documentContext.path },
    { key: "Language:", value: documentContext.lang ?? "not set" },
    { key: "Text direction:", value: documentContext.dir ?? "not set" },
    { key: "Hash:", value: documentContext.hash ?? "none" },
    { key: "Query keys:", value: documentContext.queryKeys.length === 0 ? "none" : documentContext.queryKeys.join(", ") }
  ]);
}

export function renderDocumentContextList(
  title: string,
  activeView: AIDocumentContextView,
  documentContext: SafeDocumentContext,
  emptyState: string
): string {
  if (activeView === "meta-tags") {
    return `
      <div class="ai-section-subheader">
        ${renderDevtoolsTitleRow(title, "is-cyan", "meta")}
        ${renderAIDocumentContextViewControls(activeView)}
      </div>
      ${documentContext.metaTags.length === 0
        ? `<div class="empty-state">${escapeHtml(emptyState)}</div>`
        : `<ul class="stack-list compact-list">${documentContext.metaTags.map((tag) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-cyan">${escapeHtml(tag.key)}</span>
              <span class="muted-text">${escapeHtml(tag.source)}</span>
              <span>${escapeHtml(tag.value)}</span>
            </li>
          `).join("")}</ul>`}
    `;
  }

  return `
    <div class="ai-section-subheader">
      ${renderDevtoolsTitleRow(title, "is-cyan", "meta")}
      ${renderAIDocumentContextViewControls(activeView)}
    </div>
    ${documentContext.linkTags.length === 0
      ? `<div class="empty-state">${escapeHtml(emptyState)}</div>`
      : `<ul class="stack-list compact-list">${documentContext.linkTags.map((tag) => `
          <li class="stack-item performance-item">
            <span class="accent-text is-cyan">${escapeHtml(tag.rel)}</span>
            <span class="muted-text">${escapeHtml(tag.sameOrigin ? "same-origin" : "cross-origin")}</span>
            <span>${escapeHtml(tag.href)}</span>
          </li>
        `).join("")}</ul>`}
  `;
}

export function resolveAIDiagnosticsIconName(section: AIDiagnosticsSectionKey, title: string) {
  return section === "analysis-output"
    ? "bridge"
    : resolveDevtoolsIconName(title, section === "code-references"
      ? "code"
      : section === "metadata-checks" || section === "document-context"
        ? "meta"
        : "ai");
}

export function renderAIKeyValueList(rows: Array<{ key: string; value: string }>): string {
  return `
    <div class="inspector-keyvalue-list">
      ${rows.map((row) => `
        <div class="inspector-keyvalue-row">
          <div class="inspector-keyvalue-key">${escapeHtml(row.key)}</div>
          <div class="inspector-keyvalue-value">${escapeHtml(row.value)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderStructuredAIAssistantListContent(
  items: string[],
  label: string,
  tone: "issue-error" | "issue-warn" | ""
): string {
  if (items.length === 0) {
    return "";
  }

  return `
    <ul class="stack-list compact-list">
      ${items.map((item) => `
        <li class="stack-item ${tone}">
          <span class="item-label">[${escapeHtml(label)}]</span>
          <span>${escapeHtml(item)}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderStructuredAIAssistantCodeReferencesContent(references: AIAssistantCodeReference[]): string {
  if (references.length === 0) {
    return "";
  }

  return `
    <ul class="stack-list compact-list">
      ${references.map((reference) => `
        <li class="stack-item issue-warn">
          <span class="item-label">[FILE]</span>
          <span class="accent-text is-cyan">${escapeHtml(formatAIAssistantCodeReferenceLocation(reference))}</span>
          <span>${escapeHtml(reference.reason)}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

export function renderStructuredAIAssistantResponse(
  response: AIAssistantStructuredResponse,
  fallbackText: string | null,
  requestedView: AIAnalysisOutputView
): string {
  const normalizedFallbackText = typeof fallbackText === "string" ? fallbackText.trim() : "";
  const showFallbackText = normalizedFallbackText.length > 0 && normalizedFallbackText !== response.summary;
  const views: AIAnalysisOutputViewDefinition[] = [
    {
      key: "overview",
      label: "Overview",
      title: "AI analysis overview",
      toneClass: "is-cyan",
      iconName: "ai",
      content: renderAIKeyValueList([
        { key: "Summary:", value: response.summary },
        { key: "Likely causes:", value: String(response.likelyCauses.length) },
        { key: "Code references:", value: String(response.codeReferences.length) },
        { key: "Next checks:", value: String(response.nextChecks.length) },
        { key: "Suggested fixes:", value: String(response.suggestedFixes.length) },
        { key: "Raw text:", value: showFallbackText ? "Available" : "Not needed" }
      ])
    },
    ...(response.likelyCauses.length > 0 ? [{
      key: "likely-causes",
      label: "Causes",
      title: "Likely causes",
      toneClass: "is-blue",
      iconName: "issues",
      content: renderStructuredAIAssistantListContent(response.likelyCauses, "CAUSE", "issue-warn")
    } satisfies AIAnalysisOutputViewDefinition] : []),
    ...(response.codeReferences.length > 0 ? [{
      key: "code-references",
      label: "Code",
      title: "AI code references",
      toneClass: "is-blue",
      iconName: "code",
      content: renderStructuredAIAssistantCodeReferencesContent(response.codeReferences)
    } satisfies AIAnalysisOutputViewDefinition] : []),
    ...(response.nextChecks.length > 0 ? [{
      key: "next-checks",
      label: "Checks",
      title: "Next checks",
      toneClass: "is-blue",
      iconName: "ai",
      content: renderStructuredAIAssistantListContent(response.nextChecks, "CHECK", "")
    } satisfies AIAnalysisOutputViewDefinition] : []),
    ...(response.suggestedFixes.length > 0 ? [{
      key: "suggested-fixes",
      label: "Fixes",
      title: "Suggested fixes",
      toneClass: "is-blue",
      iconName: "ai",
      content: renderStructuredAIAssistantListContent(response.suggestedFixes, "FIX", "")
    } satisfies AIAnalysisOutputViewDefinition] : []),
    ...(showFallbackText ? [{
      key: "raw-text",
      label: "Raw",
      title: "Raw assistant text",
      toneClass: "is-blue",
      iconName: "code",
      content: `<pre class="ai-response">${escapeHtml(normalizedFallbackText)}</pre>`
    } satisfies AIAnalysisOutputViewDefinition] : [])
  ];
  const activeView = views.some((view) => view.key === requestedView)
    ? requestedView
    : DEFAULT_AI_ANALYSIS_OUTPUT_VIEW;
  const selectedView = views.find((view) => view.key === activeView) ?? views[0];

  return `
    <div class="ai-diagnostics-section-block">
      <div class="ai-section-subheader">
        ${renderDevtoolsTitleRow(selectedView.title, selectedView.toneClass, selectedView.iconName)}
        ${renderAIAnalysisOutputViewControls(views, activeView)}
      </div>
      ${selectedView.content}
    </div>
  `;
}