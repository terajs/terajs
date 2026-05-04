import { collectRecentCodeReferences, formatAICodeReferenceLocation } from "../aiDebugContext.js";
import {
  formatAIAssistantCodeReferenceLocation,
  type AIAssistantCodeReference,
  type AIAssistantStructuredResponse
} from "../aiHelpers.js";
import { analyzeSafeDocumentContext, type SafeDocumentContext, type SafeDocumentDiagnostic } from "../documentContext.js";
import {
  collectMetaEntries,
  collectSignalRegistrySnapshot,
  type DevtoolsEventLike
} from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import { getExtensionAIAssistantBridge, resolveExtensionAIAssistantTimeoutMs } from "../providers/extensionBridge.js";
import {
  DEFAULT_AI_ANALYSIS_OUTPUT_VIEW,
  collectAIAssistantTelemetry,
  DEFAULT_AI_DOCUMENT_CONTEXT_VIEW,
  DEFAULT_AI_SESSION_MODE_VIEW,
  collectAIPromptInputs,
  DEFAULT_AI_DIAGNOSTICS_SECTION,
  formatAIAssistantFallbackPath,
  formatAIAssistantOutcome,
  formatAIAssistantProvider,
  hasInspectableAIValue,
  resolveAIProviderDetails,
  type AIAnalysisOutputView,
  type AIDocumentContextView,
  type AIDiagnosticsSectionKey,
  type AISessionModeView,
  type AIDiagnosticsStateLike
} from "./aiDiagnosticsModel.js";
import { buildAIDiagnosticsBridgeState } from "./aiDiagnosticsBridgeState.js";
import { renderDevtoolsButtonLabel, renderDevtoolsIcon, renderDevtoolsTitleRow, resolveDevtoolsIconName } from "../devtoolsIcons.js";
import { renderIframeComponentsScreen, renderWorkbenchList, type WorkbenchListItem } from "./iframeShells.js";

export {
  DEFAULT_AI_DIAGNOSTICS_SECTION,
  DEFAULT_AI_ANALYSIS_OUTPUT_VIEW,
  DEFAULT_AI_DOCUMENT_CONTEXT_VIEW,
  DEFAULT_AI_SESSION_MODE_VIEW,
  type AIDiagnosticsSectionKey,
  type AIAnalysisOutputView,
  type AISessionModeView,
  type AIDocumentContextView
} from "./aiDiagnosticsModel.js";

interface AIAnalysisOutputViewDefinition {
  key: AIAnalysisOutputView;
  label: string;
  title: string;
  toneClass: "is-cyan" | "is-blue" | "is-purple";
  iconName: "ai" | "code" | "issues";
  content: string;
}

function renderAIDocumentContextViewControls(activeView: AIDocumentContextView): string {
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

function renderAISessionModeViewControls(activeView: AISessionModeView): string {
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

function renderDocumentContextOverview(documentContext: SafeDocumentContext): string {
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

function renderDocumentContextList(
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

function resolveAIDiagnosticsIconName(section: AIDiagnosticsSectionKey, title: string) {
  return section === "analysis-output"
    ? "bridge"
    : resolveDevtoolsIconName(title, section === "code-references"
    ? "code"
    : section === "metadata-checks" || section === "document-context"
      ? "meta"
      : "ai");
}

function renderAIKeyValueList(rows: Array<{ key: string; value: string }>): string {
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

function renderStructuredAIAssistantResponse(
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

export function renderAIDiagnosticsPanel(state: AIDiagnosticsStateLike): string {
  const providerDetails = resolveAIProviderDetails(state);
  const assistantTelemetry = collectAIAssistantTelemetry(state.events);
  const snapshotSignals = collectSignalRegistrySnapshot();
  const metaEntries = collectMetaEntries(state.events);
  const componentAIMetadataCount = metaEntries.filter((entry) => !entry.key.startsWith("route:") && hasInspectableAIValue(entry.ai)).length;
  const routeAIMetadataCount = metaEntries.filter((entry) => entry.key.startsWith("route:") && hasInspectableAIValue(entry.ai)).length;
  const mountedAIPreviewCount = Array.from(state.mountedComponents.values()).filter((entry) => typeof entry.aiPreview === "string" && entry.aiPreview.trim().length > 0).length;
  const promptInputs = collectAIPromptInputs(state);
  const promptInputErrorCount = promptInputs.filter((input) => input.severity === "error").length;
  const promptInputWarnCount = promptInputs.filter((input) => input.severity === "warn").length;
  const codeReferences = collectRecentCodeReferences(state.events, 10);
  const documentContext = state.documentContext ?? null;
  const documentDiagnostics = state.documentDiagnostics ?? analyzeSafeDocumentContext(documentContext);
  const documentWarnCount = documentDiagnostics.filter((entry) => entry.severity === "warn").length;
  const documentInfoCount = documentDiagnostics.filter((entry) => entry.severity === "info").length;
  const extensionBridgeTimeoutMs = resolveExtensionAIAssistantTimeoutMs(state.aiAssistantTimeoutMs);
  const {
    ideBridgeStatus,
    canQueryExtensionAssistant,
    canConnectExtensionBridge,
    canRetryExtensionBridge,
    canDisconnectExtensionBridge,
    canShowBridgeConnectAction,
    bridgeConnectActionDisabled,
    vscodeRequestPending,
    debuggingPromptStatusLabel,
    extensionBridgeStatusLabel,
    extensionActionLabel,
    bridgeConnectActionLabel,
    debuggingPromptHint,
    extensionActionHint,
    ideBridgeHint,
    analysisSummary,
    integrationWarnings
  } = buildAIDiagnosticsBridgeState({
    state,
    providerDetails,
    componentAIMetadataCount,
    routeAIMetadataCount,
    mountedAIPreviewCount,
    documentContext
  });

  let assistantOutputMarkup = "";
  if (state.aiStatus === "loading") {
    assistantOutputMarkup = `<div class="empty-state">${escapeHtml(
      state.activeAIRequestTarget === "vscode"
        ? "Waiting for the attached VS Code bridge to respond with the current sanitized diagnostics bundle..."
        : "Running the selected assistant with the current sanitized diagnostics bundle..."
    )}</div>`;
  } else if (state.aiError) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        ${renderDevtoolsTitleRow("Assistant request failed", "is-red", "issues")}
        <div class="stack-item issue-error">
          <span class="item-label">[ERROR]</span>
          <span>${escapeHtml(state.aiError)}</span>
        </div>
      </div>
    `;
  } else if (state.aiStructuredResponse) {
    assistantOutputMarkup = renderStructuredAIAssistantResponse(
      state.aiStructuredResponse,
      state.aiResponse,
      state.activeAIAnalysisOutputView ?? DEFAULT_AI_ANALYSIS_OUTPUT_VIEW
    );
  } else if (state.aiResponse) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        ${renderDevtoolsTitleRow("Assistant response", "is-cyan", "ai")}
        <pre class="ai-response">${escapeHtml(state.aiResponse)}</pre>
      </div>
    `;
  } else if (state.aiPrompt) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        ${renderDevtoolsTitleRow(canQueryExtensionAssistant ? "Connected and ready" : "Debugging prompt ready", "is-cyan", "ai")}
        <div class="muted-text">${escapeHtml(canQueryExtensionAssistant ? "The bridge is attached. This VS Code window is ready for direct agent inspection of the current sanitized snapshot, and Ask Copilot can use the same bundle immediately." : "The current session bundle is ready to copy into your own agent or debugging chat.")}</div>
      </div>
    `;
  } else {
    assistantOutputMarkup = `
      <div class="empty-state">${escapeHtml(canQueryExtensionAssistant ? "Connected and ready. Ask Copilot or copy the debugging prompt to capture the active runtime state." : "Copy the debugging prompt to package the current runtime evidence for an external assistant.")}</div>
    `;
  }

  const navItems: Array<{
    key: AIDiagnosticsSectionKey;
    title: string;
    summary: string;
    description: string;
  }> = [
    {
      key: "analysis-output",
      title: "AI Bridge",
      summary: analysisSummary,
      description: "Bridge controls, request state, and the reusable prompt payload."
    },
    {
      key: "session-mode",
      title: "Session Mode",
      summary: providerDetails.label,
      description: "Provider state, integration coverage, and why this session is provider-backed or prompt-first."
    },
    {
      key: "prompt-inputs",
      title: "Prompt Inputs",
      summary: `${promptInputs.length} items`,
      description: "The runtime warnings, likely causes, and document diagnostics included in the next analysis run."
    },
    {
      key: "code-references",
      title: "Code References",
      summary: `${codeReferences.length} refs`,
      description: "Recent issue-linked source locations that AI and IDE tools can use to jump straight to likely implementation files."
    },
    {
      key: "provider-telemetry",
      title: "Provider Telemetry",
      summary: `${assistantTelemetry.requestCount} requests`,
      description: "Request counts, last provider path, delivery mode, and the most recent assistant outcome."
    },
    {
      key: "metadata-checks",
      title: "Metadata Checks",
      summary: `${documentWarnCount} warn / ${documentInfoCount} info`,
      description: "Document-head diagnostics derived from the safe metadata snapshot for the current page."
    },
    {
      key: "document-context",
      title: "Document Context",
      summary: `${documentContext?.metaTags.length ?? 0} meta / ${documentContext?.linkTags.length ?? 0} links`,
      description: "The safe head-only context exported into the AI bundle, including allowlisted meta tags and links."
    }
  ];

  const activeSection = navItems.some((item) => item.key === state.activeAIDiagnosticsSection)
    ? state.activeAIDiagnosticsSection
    : DEFAULT_AI_DIAGNOSTICS_SECTION;
  const activeNavItem = navItems.find((item) => item.key === activeSection) ?? navItems[0];

  let detailMarkup = "";

  switch (activeSection) {
    case "session-mode": {
      const activeSessionModeView = state.activeAISessionModeView ?? DEFAULT_AI_SESSION_MODE_VIEW;
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="ai-section-subheader">
            ${renderDevtoolsTitleRow(activeSessionModeView === "overview" ? "Session mode overview" : "Integration coverage", activeSessionModeView === "overview" ? "is-blue" : "is-cyan", activeSessionModeView === "overview" ? "settings" : "ai")}
            ${renderAISessionModeViewControls(activeSessionModeView)}
          </div>
          ${activeSessionModeView === "overview"
            ? `
              ${renderAIKeyValueList([
                { key: "Provider mode:", value: providerDetails.label },
                { key: "VS Code bridge:", value: extensionBridgeStatusLabel },
                { key: "Receiver discovered:", value: ideBridgeStatus.hasManifest ? "Yes" : "No" },
                { key: "Built-in model:", value: providerDetails.builtInModel },
                { key: "Current insight:", value: state.aiLikelyCause ?? "No reactive error detected yet." },
                { key: "Active path:", value: providerDetails.activePath },
                { key: "Model:", value: state.aiAssistantModel },
                { key: "Timeout:", value: providerDetails.hasExtensionBridge ? `${state.aiAssistantTimeoutMs}ms (${extensionBridgeTimeoutMs}ms for VS Code bridge)` : `${state.aiAssistantTimeoutMs}ms` },
                { key: "How it works:", value: providerDetails.hasExtensionBridge ? "DevTools assembles keyed signal snapshots, sanity metrics, recent issue events, and safe document head context into one diagnostics bundle, then mirrors that sanitized session live into the attached VS Code bridge." : "DevTools assembles keyed signal snapshots, sanity metrics, recent issue events, and safe document head context into one diagnostics bundle." }
              ])}
              <div class="muted-text ai-hint">${escapeHtml(providerDetails.detail)}</div>
            `
            : `
              ${renderAIKeyValueList([
                { key: "Snapshot signals:", value: String(snapshotSignals.length) },
                { key: "AI metadata:", value: String(componentAIMetadataCount + routeAIMetadataCount) },
                { key: "Mounted AI previews:", value: String(mountedAIPreviewCount) },
                { key: "Component AI metadata:", value: String(componentAIMetadataCount) },
                { key: "Route AI metadata:", value: String(routeAIMetadataCount) },
                { key: "Prompt inputs:", value: String(promptInputs.length) },
                { key: "Prompt ready:", value: state.aiPrompt ? "Yes" : "No" },
                { key: "Last bridge error:", value: ideBridgeStatus.lastError ?? "none" }
              ])}
              ${integrationWarnings.length === 0 ? `<div class="empty-state">AI-aware metadata is visible and the panel is ready to help triage integration issues.</div>` : `
                <ul class="stack-list compact-list">
                  ${integrationWarnings.map((warning) => `
                    <li class="stack-item issue-warn">
                      <span class="item-label">[CHECK]</span>
                      <span>${escapeHtml(warning)}</span>
                    </li>
                  `).join("")}
                </ul>
              `}
            `}
        </div>
      `;
      break;
    }

    case "prompt-inputs": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          ${renderDevtoolsTitleRow("Evidence included in prompt", "is-blue", "ai")}
          ${renderAIKeyValueList([
            { key: "Prompt inputs:", value: String(promptInputs.length) },
            { key: "Error inputs:", value: String(promptInputErrorCount) },
            { key: "Warning inputs:", value: String(promptInputWarnCount) },
            { key: "Document inputs:", value: String((state.documentDiagnostics ?? []).length) }
          ])}
          ${promptInputs.length === 0 ? `<div class="empty-state">No recent errors, warnings, or likely-cause hints are queued for AI triage yet.</div>` : `
            <ul class="stack-list log-list">
              ${promptInputs.map((input) => `
                <li class="stack-item ${input.severity === "error" ? "issue-error" : input.severity === "warn" ? "issue-warn" : ""}">
                  <span class="item-label">[${escapeHtml(input.label)}]</span>
                  <span>${escapeHtml(input.summary)}</span>
                </li>
              `).join("")}
            </ul>
          `}
        </div>
      `;
      break;
    }

    case "code-references": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          ${renderDevtoolsTitleRow("Source locations exported to AI and IDE tools", "is-blue", "code")}
          ${renderAIKeyValueList([
            { key: "Code references:", value: String(codeReferences.length) },
            { key: "How to use:", value: "Use these files and lines to jump directly into likely failure points from VS Code or the AI assistant." }
          ])}
          ${codeReferences.length === 0 ? `<div class="empty-state">No recent issue events are carrying source locations yet.</div>` : `
            <ul class="stack-list compact-list">
              ${codeReferences.map((reference) => `
                <li class="stack-item ${reference.level === "error" ? "issue-error" : "issue-warn"}">
                  <span class="item-label">[${escapeHtml(reference.level.toUpperCase())}]</span>
                  <span class="accent-text is-cyan">${escapeHtml(formatAICodeReferenceLocation(reference))}</span>
                  <span>${escapeHtml(reference.summary)}</span>
                  <span class="muted-text">${escapeHtml(reference.eventType)}</span>
                </li>
              `).join("")}
            </ul>
          `}
        </div>
      `;
      break;
    }

    case "provider-telemetry": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          ${renderDevtoolsTitleRow("Request path", "is-blue", "timeline")}
          ${renderAIKeyValueList([
            { key: "Requests:", value: String(assistantTelemetry.requestCount) },
            { key: "Successes:", value: String(assistantTelemetry.successCount) },
            { key: "Failures:", value: String(assistantTelemetry.errorCount) },
            { key: "Skipped:", value: String(assistantTelemetry.skippedCount) },
            ...(assistantTelemetry.lastRequest ? [
              { key: "Last provider:", value: formatAIAssistantProvider(assistantTelemetry.lastRequest.provider) },
              { key: "Delivery mode:", value: assistantTelemetry.lastRequest.delivery },
              { key: "Fallback path:", value: formatAIAssistantFallbackPath(assistantTelemetry.lastRequest.fallbackPath) },
              { key: "Prompt chars:", value: String(assistantTelemetry.lastRequest.promptChars ?? 0) },
              { key: "Snapshot signals:", value: String(assistantTelemetry.lastRequest.signalCount ?? 0) },
              { key: "Recent events:", value: String(assistantTelemetry.lastRequest.recentEventCount ?? 0) }
            ] : [])
          ])}
          ${assistantTelemetry.lastRequest ? "" : `<div class="empty-state">No provider-backed assistant request has run yet.</div>`}
        </div>
        <div class="ai-diagnostics-section-block">
          ${renderDevtoolsTitleRow("Last outcome", "is-blue", "timeline")}
          ${assistantTelemetry.lastOutcome ? renderAIKeyValueList([
            { key: "Last outcome:", value: formatAIAssistantOutcome(assistantTelemetry.lastOutcome) },
            { key: "Last latency:", value: assistantTelemetry.lastOutcome.durationMs === null ? "n/a" : `${assistantTelemetry.lastOutcome.durationMs}ms` },
            { key: "HTTP status:", value: assistantTelemetry.lastOutcome.statusCode === null ? "n/a" : String(assistantTelemetry.lastOutcome.statusCode) },
            { key: "Last message:", value: assistantTelemetry.lastOutcome.message ?? "none" }
          ]) : `<div class="empty-state">No assistant outcome has been recorded yet.</div>`}
        </div>
      `;
      break;
    }

    case "metadata-checks": {
      detailMarkup = documentDiagnostics.length === 0 ? `
        <div class="ai-diagnostics-section-block">
          ${renderAIKeyValueList([
            { key: "Warnings:", value: "0" },
            { key: "Info:", value: "0" },
            { key: "Description:", value: "OK" },
            { key: "Canonical:", value: "OK" }
          ])}
          <div class="empty-state">Safe document head checks look healthy for the current page.</div>
        </div>
      ` : `
        <div class="ai-diagnostics-section-block">
          ${renderAIKeyValueList([
            { key: "Warnings:", value: String(documentWarnCount) },
            { key: "Info:", value: String(documentInfoCount) },
            { key: "Meta tags:", value: String(documentContext?.metaTags.length ?? 0) },
            { key: "Head links:", value: String(documentContext?.linkTags.length ?? 0) }
          ])}
          ${renderDevtoolsTitleRow("Metadata checks", "is-blue", "meta")}
          <ul class="stack-list compact-list">
            ${documentDiagnostics.map((diagnostic) => `
              <li class="stack-item ${diagnostic.severity === "warn" ? "issue-warn" : ""}">
                <span class="item-label">[${escapeHtml(diagnostic.severity.toUpperCase())}]</span>
                <span class="accent-text is-purple">${escapeHtml(diagnostic.message)}</span>
                ${diagnostic.detail ? `<span>${escapeHtml(diagnostic.detail)}</span>` : ""}
              </li>
            `).join("")}
          </ul>
        </div>
      `;
      break;
    }

    case "document-context": {
      const activeDocumentContextView = state.activeAIDocumentContextView ?? DEFAULT_AI_DOCUMENT_CONTEXT_VIEW;
      detailMarkup = !documentContext ? `
        <div class="ai-diagnostics-section-block">
          <div class="empty-state">No safe document head context captured yet.</div>
        </div>
      ` : `
        <div class="ai-diagnostics-section-block">
          ${activeDocumentContextView === "overview"
            ? `
              <div class="ai-section-subheader">
                ${renderDevtoolsTitleRow("Document context overview", "is-cyan", "meta")}
                ${renderAIDocumentContextViewControls(activeDocumentContextView)}
              </div>
              ${renderDocumentContextOverview(documentContext)}
            `
            : activeDocumentContextView === "meta-tags"
              ? renderDocumentContextList("Allowlisted meta tags", activeDocumentContextView, documentContext, "No allowlisted head meta tags were captured.")
              : renderDocumentContextList("Allowlisted head links", activeDocumentContextView, documentContext, "No allowlisted head links were captured.")}
        </div>
      `;
      break;
    }

    case "analysis-output":
    default: {
      detailMarkup = `
        <div class="ai-diagnostics-section-block ai-bridge-section--spotlight">
          ${renderDevtoolsTitleRow("AI Bridge", "is-cyan", "bridge")}
          <div class="ai-connection-row">
            <span class="ai-connection-pill ${state.aiPrompt ? "is-ready" : "is-idle"}">${escapeHtml(debuggingPromptStatusLabel)}</span>
            <span class="ai-connection-pill ai-bridge-live-pill ${(canQueryExtensionAssistant || canConnectExtensionBridge) ? "is-ready" : "is-idle"}">${escapeHtml(extensionBridgeStatusLabel)}</span>
          </div>
          <div class="button-row ai-bridge-actions">
            ${canShowBridgeConnectAction ? `<button class="toolbar-button ai-bridge-primary-action ai-bridge-connect-action ${bridgeConnectActionDisabled ? "is-disabled" : ""}" data-action="${canRetryExtensionBridge ? "retry-vscode-bridge" : "connect-vscode-bridge"}" type="button" ${bridgeConnectActionDisabled ? "disabled" : ""}>${renderDevtoolsButtonLabel(bridgeConnectActionLabel, "ai")}</button>` : ""}
            ${canQueryExtensionAssistant ? `<button class="toolbar-button ai-bridge-primary-action ${vscodeRequestPending ? "is-loading" : ""}" data-action="ask-vscode-ai" type="button" ${state.aiStatus === "loading" ? "disabled" : ""} ${vscodeRequestPending ? 'aria-busy="true"' : ""}>${renderDevtoolsButtonLabel(extensionActionLabel, "ai")}</button>` : ""}
            ${canDisconnectExtensionBridge ? `<button class="toolbar-button" data-action="disconnect-vscode-bridge" type="button">${renderDevtoolsButtonLabel("Disconnect Bridge", "settings")}</button>` : ""}
          </div>
          <div class="muted-text ai-hint">${escapeHtml(debuggingPromptHint)}</div>
          ${canQueryExtensionAssistant ? `<div class="muted-text ai-hint">${escapeHtml(vscodeRequestPending ? "The attached extension is thinking through the current sanitized diagnostics bundle now." : extensionActionHint)}</div>` : ""}
          <div class="muted-text ai-hint">${escapeHtml(ideBridgeHint)}</div>
          <div class="muted-text ai-hint">${escapeHtml(providerDetails.detail)}</div>
        </div>
        ${assistantOutputMarkup}
        <div class="ai-diagnostics-section-block ai-prompt-panel">
          <div class="ai-prompt-panel-header">
            ${renderDevtoolsTitleRow("Debugging prompt payload", "is-blue", "code")}
            <button class="toolbar-button toolbar-button--icon-only ai-prompt-copy-button" data-action="copy-debugging-prompt" type="button" aria-label="Copy prompt" title="Copy prompt">${renderDevtoolsIcon("copy", "devtools-icon--md")}</button>
          </div>
          ${state.aiPrompt
            ? `<pre class="ai-prompt">${escapeHtml(state.aiPrompt)}</pre>`
            : `<div class="empty-state">Use the AI Bridge controls to assemble the current diagnostics bundle, then copy it from the prompt header.</div>`}
        </div>
      `;
      break;
    }
  }

  return renderIframeComponentsScreen({
    className: "ai-panel-screen",
    treeAriaLabel: "Bridge sections",
    treeBody: renderWorkbenchList(navItems.map((item): WorkbenchListItem => ({
      title: item.title,
      summary: item.summary,
      meta: item.description,
      iconName: resolveAIDiagnosticsIconName(item.key, item.title),
      active: activeSection === item.key,
      attributes: { "data-ai-section": item.key }
    }))),
    detailAriaLabel: "Bridge detail",
    detailTitle: activeNavItem.title,
    detailSubtitle: activeNavItem.description,
    detailHeaderVisible: false,
    detailIconName: resolveAIDiagnosticsIconName(activeSection, activeNavItem.title),
    detailBody: `
      <section data-ai-active-section="${activeSection}">
        <div class="ai-diagnostics-detail-stack">
          ${detailMarkup}
        </div>
      </section>
    `
  });
}