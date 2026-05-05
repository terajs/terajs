export const overlaySidebarNavigationStyles = `

  #terajs-devtools-root[data-theme="light"] .ai-workbench-pane {
    background: var(--tera-surface-pane);
    color: var(--tera-light-text-strong);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-rail {
    background: var(--tera-surface-pane-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-main {
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-details {
    background: var(--tera-surface-section-strong);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-details summary {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero {
    background:
      linear-gradient(135deg, rgba(63, 124, 255, 0.08), rgba(106, 84, 215, 0.06) 42%, rgba(11, 122, 153, 0.05) 68%),
      var(--tera-surface-section-strong);
    border-color: var(--tera-separator);
    box-shadow: var(--tera-light-shadow);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero-pill {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(235, 245, 255, 0.9));
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .panel-section-heading {
    color: var(--tera-light-text-strong);
  }

  .ask-ai-button {
    background: rgba(34, 66, 124, 0.58);
    color: #f4f8ff;
    border: 1px solid rgba(97, 156, 255, 0.26);
    box-shadow: none;
  }

  .ask-ai-button:hover {
    background: rgba(42, 79, 145, 0.62);
  }

  #terajs-devtools-root[data-theme="light"] .ask-ai-button {
    background: rgba(73, 126, 255, 0.12);
    color: var(--tera-light-text-strong);
    border-color: rgba(73, 126, 255, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .ask-ai-button:hover {
    background: rgba(73, 126, 255, 0.18);
    color: var(--tera-light-text-strong);
  }

  .devtools-tabs {
    border-right: 0;
    border-bottom: 0;
    padding: 10px 8px;
    gap: 8px;
    background: transparent;
  }

  .tab-button,
  .toolbar-button,
  .filter-button,
  .select-button {
    border-radius: 6px;
    border-color: transparent;
    background: transparent;
    box-shadow: none;
    font-weight: 500;
    line-height: 1.4;
  }

  .toolbar-button,
  .filter-button,
  .select-button {
    min-height: 38px;
    padding: 8px 12px;
    border-color: var(--tera-separator);
    background: var(--tera-surface-section);
    color: rgba(229, 239, 255, 0.88);
  }

  .tab-button {
    min-width: 52px;
    min-height: 46px;
    padding: 0;
    justify-content: center;
    position: relative;
  }

  .tab-button::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: 8px;
    width: 24px;
    height: 1px;
    border-radius: 999px;
    transform: translateX(-50%);
    background: var(--tera-tone-info-muted);
    opacity: 0.44;
    pointer-events: none;
  }

  .tab-button-content {
    justify-content: center;
  }

  .tab-button .tab-button-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .devtools-sidebar .tab-button,
  .components-screen-sidebar .tab-button {
    width: 100%;
  }

  .devtools-icon-badge {
    width: 20px;
    height: 20px;
    border-radius: 0;
    border: 0;
    background: transparent;
    color: #c8d8ff;
    box-shadow: none;
  }

  .tab-button.is-active,
  .filter-button.is-active,
  .toolbar-button.is-active,
  .select-button.is-selected {
    border-color: var(--tera-tone-accent-soft);
    background: var(--tera-surface-row-active);
    color: #ffffff;
    box-shadow: inset 0 0 0 1px rgba(83, 203, 255, 0.1);
  }

  .tab-button.is-active::after {
    background: var(--tera-tone-info);
    opacity: 0.92;
  }

  .tab-button.is-active .devtools-icon-badge,
  .toolbar-button.is-active .devtools-icon-badge,
  .filter-button.is-active .devtools-icon-badge,
  .select-button.is-selected .devtools-icon-badge {
    background: transparent;
    color: #ffffff;
    border: 0;
  }

  .tab-button:hover,
  .toolbar-button:hover,
  .filter-button:hover,
  .select-button:hover {
    border-color: var(--tera-separator-strong);
    background: var(--tera-surface-row-hover);
    transform: none;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button,
  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: transparent;
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button:hover,
  #terajs-devtools-root[data-theme="light"] .toolbar-button:hover,
  #terajs-devtools-root[data-theme="light"] .filter-button:hover,
  #terajs-devtools-root[data-theme="light"] .select-button:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button.is-active,
  #terajs-devtools-root[data-theme="light"] .filter-button.is-active,
  #terajs-devtools-root[data-theme="light"] .toolbar-button.is-active,
  #terajs-devtools-root[data-theme="light"] .select-button.is-selected {
    background: var(--tera-surface-row-active);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-tone-accent-soft);
    box-shadow: inset 0 0 0 1px rgba(63, 124, 255, 0.08);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button::after {
    background: var(--tera-tone-info-muted);
    opacity: 0.52;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button.is-active::after {
    background: var(--tera-tone-info);
    opacity: 0.88;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-icon-badge {
    color: var(--tera-light-text-soft);
  }

  .devtools-sidebar .tab-button,
  .components-screen-sidebar .tab-button {
    border: 0;
    border-left: 3px solid transparent;
    border-radius: 0;
    min-height: 56px;
    padding: 0;
    background: transparent;
    flex: 0 0 56px;
  }

  .devtools-sidebar .tab-button:hover,
  .components-screen-sidebar .tab-button:hover {
    border-left-color: rgba(108, 147, 255, 0.34);
    background: var(--tera-surface-row-hover);
  }

  .devtools-sidebar .tab-button.is-active,
  .components-screen-sidebar .tab-button.is-active {
    border-left-color: rgba(53, 198, 255, 0.72);
    background: var(--tera-surface-row-active);
    box-shadow: none;
  }

  .devtools-sidebar .tab-button-content,
  .components-screen-sidebar .tab-button-content {
    justify-content: center;
  }

  .devtools-sidebar .tab-button-icon-wrap,
  .components-screen-sidebar .tab-button-icon-wrap {
    width: 38px;
    height: 38px;
  }

  .devtools-sidebar .devtools-icon-badge,
  .components-screen-sidebar .devtools-icon-badge {
    width: 32px;
    height: 32px;
  }

  .devtools-sidebar .devtools-icon,
  .components-screen-sidebar .devtools-icon {
    width: 22px;
    height: 22px;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-sidebar .tab-button:hover,
  #terajs-devtools-root[data-theme="light"] .components-screen-sidebar .tab-button:hover {
    background: var(--tera-surface-row-hover);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-sidebar .tab-button.is-active,
  #terajs-devtools-root[data-theme="light"] .components-screen-sidebar .tab-button.is-active {
    border-left-color: rgba(63, 124, 255, 0.62);
    background: var(--tera-surface-row-active);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-sidebar .devtools-icon-badge,
  #terajs-devtools-root[data-theme="light"] .components-screen-sidebar .devtools-icon-badge {
    color: var(--tera-light-accent-strong);
  }

  .danger-button {
    background: rgba(96, 22, 51, 0.84);
    border-color: rgba(255, 113, 150, 0.24);
  }

  .devtools-panel-shell {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: hidden;
  }
`;