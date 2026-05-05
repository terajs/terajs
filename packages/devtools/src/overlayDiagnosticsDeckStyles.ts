export const overlayDiagnosticsDeckStyles = `

  .devtools-utility-panel.diagnostics-deck .iframe-panel-section-block {
    padding-bottom: 16px;
    border-bottom-color: var(--tera-separator);
  }

  .devtools-utility-panel.diagnostics-deck .iframe-panel-section-block:last-child {
    padding-bottom: 0;
  }

  .devtools-utility-panel.diagnostics-deck .iframe-panel-section-heading {
    color: var(--tera-cloud);
  }

  .diagnostics-deck-hero {
    display: grid;
    gap: 10px;
    padding: 0 0 12px;
    border: 0;
    border-bottom: 1px solid var(--tera-separator);
    border-radius: 0;
    background: transparent;
  }

  .diagnostics-feed {
    display: grid;
    gap: 6px;
  }

  .diagnostics-feed-item {
    position: relative;
    display: grid;
    gap: 6px;
    padding: 10px 10px 10px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
  }

  .diagnostics-feed-item::before {
    content: "";
    position: absolute;
    left: 4px;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 999px;
    background: var(--tera-separator-strong);
    opacity: 0.72;
  }

  .diagnostics-feed-item.is-accent {
    border-color: transparent;
  }

  .diagnostics-feed-item.is-warn {
    border-color: transparent;
  }

  .diagnostics-feed-item.is-error {
    border-color: transparent;
  }

  .diagnostics-feed-item.is-accent::before {
    background: var(--tera-tone-accent);
    opacity: 1;
  }

  .diagnostics-feed-item.is-warn::before {
    background: var(--tera-tone-warn);
    opacity: 1;
  }

  .diagnostics-feed-item.is-error::before {
    background: var(--tera-tone-error);
    opacity: 1;
  }

  .diagnostics-feed-item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .diagnostics-feed-item-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
  }

  .diagnostics-feed-item-badge {
    flex: none;
    padding: 0;
    border-radius: 0;
    background: transparent;
    color: rgba(147, 167, 203, 0.78);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .diagnostics-feed-item-summary {
    color: rgba(227, 238, 255, 0.82);
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .diagnostics-feed-item-meta {
    color: rgba(147, 167, 203, 0.68);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  .diagnostics-note {
    padding: 10px 12px;
    border-left: 2px solid var(--tera-tone-accent);
    background: var(--tera-surface-section);
    color: rgba(227, 238, 255, 0.82);
    font-size: 12px;
    line-height: 1.6;
  }

  .devtools-workbench.investigation-panel {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
    --investigation-glow: rgba(53, 198, 255, 0.08);
    background:
      radial-gradient(circle at top right, var(--investigation-glow), transparent 24%),
      var(--tera-surface-page);
  }

  .devtools-workbench.investigation-panel--issues {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
    --investigation-glow: rgba(53, 198, 255, 0.08);
  }

  .devtools-workbench.investigation-panel--queue {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
    --investigation-glow: rgba(53, 198, 255, 0.08);
  }

  .devtools-workbench.investigation-panel .devtools-workbench-sidebar {
    background: var(--tera-surface-pane);
    border-right-color: var(--tera-separator);
  }

  .devtools-workbench.investigation-panel .devtools-workbench-main {
    background: var(--tera-surface-pane-muted);
  }

  .devtools-workbench.investigation-panel .devtools-workbench-header {
    background: var(--tera-surface-pane-strong);
    border-bottom-color: var(--tera-separator);
  }

  .devtools-workbench.investigation-panel .devtools-workbench-list-item {
    padding: 12px 12px 13px;
    border-radius: 14px;
    border-color: var(--tera-separator);
    background: var(--tera-surface-section);
  }

  .devtools-workbench.investigation-panel .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: var(--tera-tone-accent);
  }

  .devtools-workbench.investigation-panel .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent);
    box-shadow: inset 0 0 0 1px var(--tera-tone-accent-soft);
  }

  .devtools-workbench.investigation-panel .devtools-workbench-list-item-badge {
    background: var(--tera-surface-section-strong);
    color: var(--tera-cloud);
  }

  .devtools-workbench.investigation-panel .workbench-filter-button.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent);
  }

  .devtools-workbench.investigation-panel .devtools-workbench-metric.is-accent {
    border-color: var(--tera-tone-accent);
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-sidebar {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-pane-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-main,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel {
    background: var(--tera-surface-pane);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-main {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-pane);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-header,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel-header {
    border-bottom-color: var(--tera-separator);
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title {
    color: var(--tera-title-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-subtitle {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-fact-label,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-group {
    color: var(--tera-tone-label);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: var(--tera-separator-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent-soft);
    border-left-color: var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item.is-warn {
    border-color: rgba(214, 115, 42, 0.22);
    border-left-color: var(--tera-tone-warn);
    background: linear-gradient(180deg, rgba(214, 115, 42, 0.08), rgba(242, 246, 251, 0.9));
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item.is-error {
    border-color: rgba(178, 32, 79, 0.2);
    border-left-color: var(--tera-tone-error);
    background: linear-gradient(180deg, rgba(178, 32, 79, 0.08), rgba(242, 246, 251, 0.9));
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item-title,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-fact-value,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-lead {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item-badge {
    background: var(--tera-surface-row-active);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-section-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric-value,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-step {
    color: var(--tera-title-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric-value,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-step {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-group,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-fact-label,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric-label {
    color: var(--tera-tone-label);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-description,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-note {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-warn {
    border-color: rgba(219, 157, 50, 0.24);
  }
`;