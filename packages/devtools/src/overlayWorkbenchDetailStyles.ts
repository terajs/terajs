export const overlayWorkbenchDetailStyles = `

  .devtools-workbench-metric.is-warn {
    border-color: var(--tera-tone-warn-soft);
  }

  .devtools-workbench-metric.is-error {
    border-color: rgba(255, 107, 139, 0.2);
  }

  .devtools-workbench-metric.is-accent {
    border-color: rgba(83, 216, 176, 0.22);
  }

  .devtools-workbench-metric-label {
    color: var(--tera-tone-label);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .devtools-workbench-metric-value {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 18px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  .devtools-workbench-metric.is-accent .devtools-workbench-metric-value {
    color: var(--tera-mint);
  }

  .devtools-workbench-metric.is-warn .devtools-workbench-metric-value {
    color: var(--tera-amber);
  }

  .devtools-workbench-metric.is-error .devtools-workbench-metric-value {
    color: var(--tera-rose);
  }

  .devtools-workbench-steps {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: workbench-step;
  }

  .devtools-workbench-step {
    counter-increment: workbench-step;
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    color: var(--tera-cloud);
    font-size: 12px;
    line-height: 1.6;
  }

  .devtools-workbench-step::before {
    content: counter(workbench-step);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: #243b63;
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 700;
  }

  .devtools-workbench-note {
    padding-top: 12px;
    border-top: 1px solid rgba(52, 79, 118, 0.72);
    color: rgba(179, 198, 229, 0.76);
    font-size: 12px;
    line-height: 1.55;
  }

  .devtools-workbench-disclosure {
    border: 1px solid rgba(52, 79, 118, 0.78);
    border-left: 2px solid rgba(103, 215, 255, 0.48);
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(11, 22, 39, 0.96), rgba(12, 23, 38, 0.92));
    overflow: hidden;
  }

  .devtools-workbench-disclosure-toggle {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    cursor: pointer;
    list-style: none;
  }

  .devtools-workbench-disclosure-toggle::-webkit-details-marker {
    display: none;
  }

  .devtools-workbench-disclosure-toggle::after {
    content: "Show";
    margin-left: auto;
    color: rgba(179, 198, 229, 0.76);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .devtools-workbench-disclosure[open] .devtools-workbench-disclosure-toggle::after {
    content: "Hide";
  }

  .devtools-workbench-disclosure-label {
    flex: none;
    padding: 4px 7px;
    border-radius: 999px;
    background: rgba(42, 70, 111, 0.88);
    color: rgba(231, 244, 255, 0.94);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .devtools-workbench-disclosure-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .devtools-workbench-disclosure-title {
    color: var(--tera-cloud);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
  }

  .devtools-workbench-disclosure-subtitle {
    color: rgba(147, 167, 203, 0.72);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  .devtools-workbench-disclosure-panel {
    display: grid;
    gap: 12px;
    padding: 0 14px 14px;
  }

  .devtools-value-surface {
    border: 1px solid #263753;
    border-radius: 12px;
    background: #0b1627;
    overflow: hidden;
  }

  .devtools-value-surface .structured-value-viewer,
  .devtools-value-surface .inspector-code {
    max-height: min(420px, 48vh);
    border: 0;
    background: transparent;
  }

  .devtools-workbench .iframe-panel-stack,
  .devtools-utility-panel .iframe-panel-stack {
    display: grid;
    gap: 14px;
  }

  .devtools-workbench .iframe-panel-section-block,
  .devtools-utility-panel .iframe-panel-section-block {
    gap: 10px;
    padding: 0 0 14px;
    border: 0;
    border-bottom: 1px solid #243752;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .devtools-workbench .iframe-panel-section-block:last-child,
  .devtools-utility-panel .iframe-panel-section-block:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .devtools-workbench .iframe-panel-section-heading,
  .devtools-utility-panel .iframe-panel-section-heading,
  .devtools-workbench .signals-section-heading,
  .devtools-workbench .meta-panel-section-heading {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .workbench-filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .workbench-filter-button {
    appearance: none;
    min-height: 34px;
    padding: 7px 10px;
    border: 1px solid var(--tera-separator-strong);
    border-radius: 12px;
    background: var(--tera-surface-raised);
    color: rgba(179, 198, 229, 0.76);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
  }

  .workbench-filter-button:hover {
    background: var(--tera-surface-row-hover);
    border-color: var(--tera-separator-strong);
    color: var(--tera-cloud);
  }

  .workbench-filter-button.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent-soft);
    color: var(--tera-cloud);
  }

  .devtools-workbench.signals-inspector-panel {
    grid-template-columns: minmax(220px, 272px) minmax(0, 1fr);
    gap: 0;
    background: var(--tera-surface-page);
  }

  .signals-toolbar {
    display: grid;
    gap: 8px;
    width: 100%;
  }

  .signals-detail-view-row {
    margin-left: auto;
  }

  .signals-mode-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
  }

  .signals-mode-row .workbench-filter-button {
    justify-content: flex-start;
    min-height: 40px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--tera-surface-section);
    line-height: 1.45;
    text-align: left;
  }

  .signals-layout .workbench-search {
    width: 100%;
    flex: 1 1 auto;
  }

  .signals-layout .devtools-workbench-sidebar-body {
    padding-top: 8px;
  }

  .signals-layout .devtools-workbench-main-body {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    gap: 14px;
  }

  .signals-layout .devtools-workbench-main-body > .iframe-panel-stack {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    min-height: 0;
    height: 100%;
  }

  .signals-layout .devtools-workbench-list {
    gap: 8px;
  }
`;