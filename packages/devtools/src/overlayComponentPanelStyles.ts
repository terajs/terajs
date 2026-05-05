export const overlayComponentPanelStyles = `

  .component-drilldown-headline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--tera-border);
    padding: 0 0 8px;
  }

  .component-drilldown-id {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .component-drilldown-path {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 13px;
    font-weight: 700;
  }

  .component-drilldown-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
  }

  .inspector-surface {
    display: grid;
    align-content: flex-start;
    gap: 8px;
    flex: 1;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow: auto;
    overflow-x: hidden;
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-headline {
    border-bottom-color: var(--tera-light-border-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-path {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-meta {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree,
  #terajs-devtools-root[data-theme="light"] .components-screen-inspector {
    background: var(--tera-surface-pane);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-header {
    background: var(--tera-surface-pane-muted);
    border-bottom-color: var(--tera-separator);
  }

  .components-screen-tree .components-screen-header {
    background: linear-gradient(180deg, rgba(22, 37, 71, 0.84), rgba(12, 20, 38, 0.78));
    border-bottom-color: rgba(47, 109, 255, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree .components-screen-header {
    background: var(--tera-surface-pane-muted);
    border-bottom-color: var(--tera-separator);
  }

  .devtools-tabs {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid var(--tera-border);
    background: rgba(13, 13, 13, 0.84);
    display: flex;
    flex-direction: row;
    overflow: auto hidden;
    padding: 6px;
    gap: 6px;
    backdrop-filter: blur(12px);
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs {
    background: var(--tera-surface-sidebar);
    border-right-color: var(--tera-light-border);
    border-bottom-color: var(--tera-light-border);
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
  }

  .tab-button,
  .toolbar-button,
  .filter-button,
  .select-button {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 8px 10px;
    background: rgba(46, 46, 46, 0.76);
    color: var(--tera-cloud);
    cursor: pointer;
    font: inherit;
    font-weight: 500;
    line-height: 1.4;
    text-align: left;
    transition: transform 120ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
  }

  .toolbar-button,
  .filter-button,
  .select-button {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 38px;
    text-align: left;
  }

  .toolbar-button--icon-only {
    justify-content: center;
    width: 40px;
    min-width: 40px;
    min-height: 40px;
    padding: 0;
  }

  .toolbar-button--compact,
  .select-button--compact {
    min-height: 34px;
    padding: 7px 10px;
    border-radius: 12px;
    font-size: 12px;
    line-height: 1.35;
  }

  .tab-button {
    white-space: nowrap;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    text-align: center;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .devtools-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    color: currentColor;
  }

  .devtools-icon svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .devtools-icon--sm {
    width: 14px;
    height: 14px;
  }

  .devtools-icon--md {
    width: 16px;
    height: 16px;
  }

  .devtools-icon--lg {
    width: 18px;
    height: 18px;
  }

  .devtools-icon-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border-radius: 10px;
    border: 1px solid rgba(50, 215, 255, 0.18);
    background: linear-gradient(180deg, rgba(50, 215, 255, 0.12), rgba(47, 109, 255, 0.14));
    color: var(--tera-cyan);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .devtools-icon-badge--title {
    width: 32px;
    height: 32px;
    border-radius: 12px;
  }

  .devtools-icon-badge--button,
  .devtools-icon-badge--heading,
  .devtools-icon-badge--metric {
    width: 24px;
    height: 24px;
    border-radius: 9px;
  }

  .tab-button-content,
  .toolbar-button-content {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .devtools-title-row,
  .devtools-heading-row,
  .metric-label-row {
    display: inline-flex;
    align-items: center;
    gap: 0;
    min-width: 0;
  }

  .devtools-heading-row.has-icon {
    gap: 10px;
  }

  .tab-button-content,
  .toolbar-button-content {
    width: 100%;
  }

  .tab-button-icon-wrap {
    width: 26px;
    height: 26px;
    border-radius: 9px;
  }

  .tab-button-label,
  .toolbar-button-label {
    color: inherit;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .devtools-heading-text {
    color: var(--tera-tone-label);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .toolbar-button-label {
    text-align: left;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    font-size: 12px;
    font-weight: 550;
    line-height: 1.4;
  }

  .tab-button:hover,
  .toolbar-button:hover,
  .filter-button:hover,
  .select-button:hover {
    border-color: rgba(50, 215, 255, 0.32);
    background: rgba(50, 215, 255, 0.14);
    transform: translateY(-1px);
  }

  .toolbar-button:disabled,
  .toolbar-button:disabled:hover {
    cursor: wait;
    transform: none;
    opacity: 0.82;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button,
  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: rgba(255, 255, 255, 0.94);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border);
  }
`;