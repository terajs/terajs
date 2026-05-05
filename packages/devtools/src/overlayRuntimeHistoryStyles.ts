export const overlayRuntimeHistoryStyles = `

  .runtime-history-panel {
    display: grid;
    gap: 10px;
    margin-top: 4px;
    padding: 10px 12px;
    border: 1px solid rgba(50, 215, 255, 0.18);
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(7, 18, 35, 0.72), rgba(5, 11, 24, 0.88));
    min-width: 0;
  }

  .runtime-history-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .runtime-history-heading {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .runtime-history-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .runtime-history-caption {
    color: var(--tera-mist);
    font-size: 11px;
    line-height: 1.45;
  }

  .runtime-history-count {
    display: inline-flex;
    align-items: center;
    padding: 0 0 0 10px;
    border-radius: 0;
    border: 0;
    border-left: 2px solid rgba(76, 123, 255, 0.38);
    background: transparent;
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .runtime-history-scroll {
    max-height: 156px;
    min-width: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding-right: 2px;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  .runtime-history-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .runtime-history-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid rgba(50, 215, 255, 0.14);
    border-radius: 10px;
    background: rgba(4, 9, 19, 0.64);
    min-width: 0;
  }

  .runtime-history-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 20px;
    padding: 0 6px;
    border-radius: 4px;
    background: linear-gradient(90deg, rgba(76, 123, 255, 0.18), rgba(122, 99, 255, 0.08));
    color: #eef5ff;
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .runtime-history-text {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .runtime-history-empty {
    padding: 10px 12px;
    border: 1px dashed rgba(50, 215, 255, 0.22);
    border-radius: 10px;
    background: rgba(4, 9, 19, 0.38);
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.45;
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-panel {
    background: var(--tera-surface-pane-strong);
    border-color: var(--tera-separator-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-caption {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-count {
    border-left-color: rgba(106, 84, 215, 0.3);
    background: transparent;
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll {
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-item {
    background: var(--tera-surface-raised);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-badge {
    background: var(--tera-surface-row-active);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-text {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-empty {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-pill {
    background: transparent;
    border-left-color: rgba(106, 84, 215, 0.32);
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-badge {
    background: var(--tera-light-accent-soft);
    border-color: var(--tera-light-border);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-badge.is-root {
    background: var(--tera-light-accent-soft-strong);
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-meta {
    color: var(--tera-light-text-muted);
  }

  .reactive-feed,
  .activity-feed {
    margin: 0;
    max-height: 320px;
  }

  .inspector-control-list {
    display: grid;
    gap: 4px;
    margin-top: 8px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-dropdown {
    border-left: 1px solid rgba(50, 215, 255, 0.18);
    padding-left: 10px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-dropdown-summary {
    list-style: none;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;
    padding: 3px 0 3px 14px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-dropdown-label {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    flex-wrap: wrap;
  }

  .inspector-dropdown-origin {
    color: var(--tera-cyan);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border: 1px solid rgba(50, 215, 255, 0.28);
    border-radius: 999px;
    padding: 1px 6px;
    line-height: 1.2;
  }

  .inspector-dropdown-summary::marker,
  .inspector-dropdown-summary::-webkit-details-marker {
    display: none;
  }

  .inspector-dropdown-summary::before {
    content: "\\25B8";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    color: var(--tera-cyan);
    font-size: 12px;
    line-height: 1;
  }

  .inspector-dropdown[open] > .inspector-dropdown-summary::before {
    content: "\\25BE";
  }

  .inspector-dropdown-key {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    font-weight: 500;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .inspector-dropdown-type {
    color: var(--tera-mist);
    font-size: 11px;
    text-transform: lowercase;
    letter-spacing: 0.02em;
  }

  .inspector-dropdown-body {
    display: grid;
    gap: 6px;
    padding: 2px 0 6px 14px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-inline-edit-row {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
  }

  .inspector-inline-value {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .inspector-live-input {
    min-width: min(200px, 100%);
    max-width: 100%;
    border: 1px solid rgba(50, 215, 255, 0.24);
    border-radius: 6px;
    background: rgba(6, 16, 34, 0.72);
    color: var(--tera-cloud);
    padding: 4px 8px;
    font: inherit;
    font-size: 12px;
  }
`;