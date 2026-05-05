export const overlayAIPanelStyles = `

  #terajs-devtools-root[data-theme="light"] .devtools-panel-shell {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }

  .devtools-panel-shell-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(108, 147, 255, 0.16);
  }

  .devtools-panel-shell-copy {
    display: grid;
    gap: 3px;
  }

  .devtools-panel-shell-kicker {
    color: var(--tera-cyan);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel-shell-kicker {
    color: var(--tera-light-accent-strong);
  }

  .devtools-panel-shell-title-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .devtools-panel-shell-icon {
    width: 18px;
    height: 18px;
    border-radius: 0;
  }

  .devtools-panel-shell-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 17px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  .devtools-panel-shell-summary {
    color: rgba(225, 236, 255, 0.72);
    font-size: 11px;
    line-height: 1.4;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel-shell-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel-shell-summary {
    color: var(--tera-light-text-muted);
  }

  .devtools-panel {
    flex: 1;
    min-height: 0;
    padding: 0;
    background: transparent;
    scrollbar-color: rgba(76, 123, 255, 0.42) rgba(9, 17, 31, 0.2);
  }

  .panel-hero-pills {
    gap: 12px;
    margin-top: 2px;
  }

  .panel-hero-pill {
    padding: 0 0 0 10px;
    border: 0;
    border-left: 2px solid rgba(76, 123, 255, 0.38);
    border-radius: 0;
    background: transparent;
    color: var(--tera-mist);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero-pill {
    background: transparent;
    border-left-color: rgba(106, 84, 215, 0.32);
    color: var(--tera-light-text-soft);
  }

  .devtools-page {
    gap: 10px;
  }

  .panel-hero {
    display: grid;
    gap: 4px;
    padding: 0 0 12px;
    border: 0;
    border-bottom: 1px solid rgba(108, 147, 255, 0.16);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .ai-panel {
    border-radius: 8px;
    background: rgba(10, 18, 31, 0.42);
    border-color: rgba(145, 173, 214, 0.12);
    box-shadow: none;
  }

  .ai-workbench-shell,
  .ai-workbench-pane,
  .ai-workbench-rail,
  .ai-workbench-main {
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero {
    background: var(--tera-surface-section-strong);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel,
  #terajs-devtools-root[data-theme="light"] .ai-panel {
    background: var(--tera-surface-pane);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-shell {
    background:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.08), transparent 26%),
      radial-gradient(circle at top right, rgba(106, 84, 215, 0.06), transparent 24%),
      var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-pane {
    background: var(--tera-surface-pane);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-rail {
    background: var(--tera-surface-pane-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-main {
    background: var(--tera-surface-pane-muted);
  }

  .panel-hero .panel-subtitle {
    max-width: 72ch;
  }

  .ai-prompt {
    display: block;
    width: 100%;
    min-height: 160px;
    max-height: min(52vh, 420px);
    border: 1px solid var(--tera-separator);
    border-radius: 6px;
    padding: 12px;
    background: var(--tera-surface-raised);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.55;
    white-space: pre;
    overflow: auto;
    overflow-wrap: normal;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .ai-prompt {
    background: var(--tera-surface-raised);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-separator);
  }

  .ai-response {
    display: block;
    width: 100%;
    min-height: 108px;
    border: 1px solid var(--tera-separator);
    border-radius: 6px;
    padding: 12px;
    background: var(--tera-surface-raised);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .ai-response {
    background: var(--tera-surface-raised);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-separator);
  }

  .ai-hint {
    display: block;
    margin-top: 4px;
    color: rgba(147, 167, 203, 0.96);
    line-height: 1.45;
  }

  .ai-prompt-panel {
    min-height: 0;
  }

  .devtools-section-subheader,
  .ai-section-subheader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .devtools-section-subcontrols,
  .ai-section-subcontrols {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .devtools-section-subcontrols .select-button,
  .ai-section-subcontrols .select-button {
    white-space: nowrap;
  }

  .ai-prompt-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .ai-prompt-copy-button .toolbar-button-content {
    justify-content: center;
  }

  #terajs-devtools-root[data-theme="light"] .ai-hint {
    color: var(--tera-light-text-muted);
  }

  .ai-diagnostics-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(180px, auto) minmax(0, 1fr);
    min-height: 360px;
    height: calc(100% + 24px);
    margin: -12px;
    overflow: hidden;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane,
  .ai-diagnostics-layout .ai-diagnostics-detail-pane {
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane,
  .ai-diagnostics-layout .ai-diagnostics-detail-pane {
    display: flex;
    flex-direction: column;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane .components-screen-body {
    flex: 1;
    overflow: visible;
    padding: 10px;
  }

  .ai-diagnostics-layout .ai-diagnostics-detail-pane .components-screen-header {
    flex: 0 0 auto;
  }

  .ai-diagnostics-layout .ai-diagnostics-detail-pane .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: 10px;
  }

  .ai-diagnostics-layout .components-tree-pane {
    border-right: 0;
    border-bottom: 1px solid var(--tera-separator);
    background: var(--tera-surface-pane);
  }

  .ai-diagnostics-layout .components-inspector-pane {
    background: var(--tera-surface-pane-muted);
  }
`;