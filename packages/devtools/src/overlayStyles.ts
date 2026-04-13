export const overlayStyles = `
  :host {
    all: initial;
  }

  .fab-shell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: auto;
  }

  .fab-shell.is-left {
    align-items: flex-start;
  }

  .fab-shell.is-center {
    align-items: center;
  }

  .fab-shell.is-top {
    flex-direction: column-reverse;
  }

  .devtools-fab {
    appearance: none;
    border: 1px solid rgba(50, 215, 255, 0.36);
    border-radius: 999px;
    background: linear-gradient(135deg, #2f6dff, #32d7ff);
    color: #ffffff;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    min-width: 102px;
    height: 42px;
    padding: 0 18px;
    cursor: pointer;
    box-shadow: 0 12px 28px rgba(47, 109, 255, 0.32);
    transition: transform 120ms ease, box-shadow 140ms ease;
    position: relative;
    z-index: 3;
  }

  .devtools-fab:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(50, 215, 255, 0.28);
  }

  .devtools-fab:focus-visible {
    outline: 2px solid rgba(50, 215, 255, 0.75);
    outline-offset: 2px;
  }

  .overlay-frame {
    --tera-black: #05070f;
    --tera-carbon: #0d1320;
    --tera-graphite: #1d2940;
    --tera-blue: #2f6dff;
    --tera-cyan: #32d7ff;
    --tera-purple: #6f6dff;
    --tera-mist: #93a7cb;
    --tera-cloud: #f2f7ff;
    --tera-body-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --tera-heading-font: "Space Grotesk", "Inter", sans-serif;
    --tera-code-font: "JetBrains Mono", "Fira Code", monospace;
    --tera-surface: var(--tera-carbon);
    --tera-border: rgba(147, 167, 203, 0.18);
    --tera-panel-glow: linear-gradient(145deg, rgba(47, 109, 255, 0.16), rgba(50, 215, 255, 0.11) 44%, rgba(111, 109, 255, 0.1));
    --tera-shadow: 0 24px 60px rgba(2, 8, 20, 0.52);
    position: relative;
    width: min(var(--terajs-overlay-panel-width, 920px), calc(100vw - 12px));
    max-width: calc(100vw - 12px);
    height: min(var(--terajs-overlay-panel-height, 760px), calc(100vh - 12px));
    max-height: calc(100vh - 12px);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--tera-shadow);
    background:
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.16), transparent 28%),
      radial-gradient(circle at bottom left, rgba(111, 109, 255, 0.16), transparent 34%),
      var(--tera-black);
    color: var(--tera-cloud);
    font-family: var(--tera-body-font);
    z-index: 2;
  }

  .fab-shell.is-center .overlay-frame {
    transform-origin: bottom center;
  }

  .fab-shell.is-top .overlay-frame {
    transform-origin: top right;
  }

  .fab-shell.is-top.is-left .overlay-frame {
    transform-origin: top left;
  }

  .fab-shell.is-top.is-center .overlay-frame {
    transform-origin: top center;
  }

  @media (min-width: 861px) {
    .overlay-frame {
      width: min(var(--terajs-overlay-panel-width, 920px), 75vw, calc(100vw - 24px));
      max-width: min(75vw, calc(100vw - 24px));
      height: min(var(--terajs-overlay-panel-height, 760px), 75vh, calc(100vh - 24px));
      max-height: min(75vh, calc(100vh - 24px));
      border-radius: 18px;
    }
  }

  .overlay-frame.is-hidden {
    display: none;
  }

  #terajs-devtools-root {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  #terajs-devtools-root[data-theme="light"] {
    color: #181818;
  }

  .devtools-shell {
    --tera-sidebar-width: 100%;
    --tera-components-tree-width: minmax(0, 1fr);
    --tera-components-column-padding: 10px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--panel-bg, transparent);
    color: inherit;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-shell {
    --panel-bg: linear-gradient(180deg, #ffffff, var(--tera-cloud));
  }

  .devtools-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--tera-border);
    background:
      linear-gradient(120deg, rgba(47, 109, 255, 0.18), rgba(50, 215, 255, 0.1) 58%, transparent),
      rgba(13, 19, 32, 0.94);
    backdrop-filter: blur(14px);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-header {
    background:
      linear-gradient(120deg, rgba(47, 109, 255, 0.1), rgba(50, 215, 255, 0.09) 60%, transparent),
      rgba(255, 255, 255, 0.92);
    border-bottom-color: rgba(46, 46, 46, 0.12);
  }

  .devtools-title {
    font-family: var(--tera-heading-font);
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--tera-cloud);
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-title {
    color: #0d2a57;
  }

  .devtools-subtitle,
  .panel-subtitle,
  .muted-text,
  .tiny-muted,
  .metric-label {
    color: var(--tera-mist);
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-subtitle,
  #terajs-devtools-root[data-theme="light"] .panel-subtitle,
  #terajs-devtools-root[data-theme="light"] .muted-text,
  #terajs-devtools-root[data-theme="light"] .tiny-muted,
  #terajs-devtools-root[data-theme="light"] .metric-label {
    color: #626262;
  }

  .devtools-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: contain;
  }

  .components-screen {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(220px, 40%) minmax(0, 1fr);
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: contain;
    background: linear-gradient(180deg, rgba(7, 13, 26, 0.94), rgba(4, 8, 18, 0.9));
  }

  .components-screen-sidebar {
    min-width: 0;
    min-height: 0;
    display: flex;
  }

  .components-screen-sidebar .devtools-tabs {
    width: 100%;
    height: auto;
  }

  .components-screen-tree,
  .components-screen-inspector {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.86), rgba(5, 9, 18, 0.92));
  }

  .components-screen-tree {
    grid-column: 1;
    grid-row: 2;
    border-right: 0;
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .components-screen-inspector {
    grid-column: 1;
    grid-row: 3;
  }

  .components-screen-header {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(14, 24, 43, 0.66), rgba(8, 13, 24, 0.6));
  }

  .components-screen-header-row {
    display: flex;
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .components-screen-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .components-screen-pill {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 0 9px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.18);
    background: rgba(7, 18, 35, 0.58);
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    letter-spacing: 0.02em;
  }

  .components-screen-search,
  .components-screen-filter {
    width: 100%;
    border: 1px solid rgba(50, 215, 255, 0.24);
    border-radius: 8px;
    background: rgba(7, 18, 35, 0.72);
    color: var(--tera-cloud);
    padding: 8px 10px;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  .components-screen-search:focus,
  .components-screen-filter:focus {
    border-color: rgba(50, 215, 255, 0.48);
    box-shadow: 0 0 0 1px rgba(50, 215, 255, 0.3);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-search,
  #terajs-devtools-root[data-theme="light"] .components-screen-filter {
    background: rgba(255, 255, 255, 0.96);
    color: #10213f;
    border-color: rgba(55, 103, 183, 0.2);
  }

  .components-screen-header .component-tree-toolbar {
    margin-bottom: 0;
  }

  .components-screen-body {
    min-width: 0;
    min-height: 0;
    padding: var(--tera-components-column-padding);
    overflow: auto;
    overscroll-behavior: contain;
  }

  .components-screen-inspector .components-screen-body {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overflow-x: hidden;
  }

  .components-screen-inspector .component-drilldown-shell {
    flex: 1;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow-x: hidden;
  }

  .component-drilldown-shell {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 8px;
    height: 100%;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

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
    border-bottom-color: rgba(54, 118, 210, 0.24);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen {
    background: linear-gradient(180deg, rgba(249, 252, 255, 0.98), rgba(243, 248, 255, 0.98));
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree,
  #terajs-devtools-root[data-theme="light"] .components-screen-inspector {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(241, 247, 255, 0.98));
    color: #10213f;
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree {
    background: linear-gradient(180deg, rgba(241, 247, 255, 0.99), rgba(231, 240, 255, 0.98));
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-header {
    background: rgba(255, 255, 255, 0.86);
    border-bottom-color: rgba(46, 46, 46, 0.12);
  }

  .components-screen-tree .components-screen-header {
    background: linear-gradient(180deg, rgba(22, 37, 71, 0.84), rgba(12, 20, 38, 0.78));
    border-bottom-color: rgba(47, 109, 255, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree .components-screen-header {
    background: linear-gradient(180deg, rgba(233, 242, 255, 0.98), rgba(223, 235, 255, 0.96));
    border-bottom-color: rgba(54, 118, 210, 0.18);
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
    background: linear-gradient(180deg, #f4f8ff, #eef4ff);
    border-right-color: rgba(32, 64, 112, 0.16);
    border-bottom-color: rgba(32, 64, 112, 0.16);
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
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
    text-align: left;
    transition: transform 120ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
  }

  .toolbar-button,
  .filter-button,
  .select-button {
    text-align: center;
  }

  .tab-button {
    white-space: nowrap;
    flex: 0 0 auto;
    text-align: center;
  }

  .tab-button:hover,
  .toolbar-button:hover,
  .filter-button:hover,
  .select-button:hover {
    border-color: rgba(50, 215, 255, 0.32);
    background: rgba(50, 215, 255, 0.14);
    transform: translateY(-1px);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button,
  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: rgba(255, 255, 255, 0.98);
    color: #14284a;
    border-color: rgba(55, 103, 183, 0.2);
  }

  .tab-button.is-active,
  .filter-button.is-active,
  .toolbar-button.is-active,
  .select-button.is-selected {
    background: linear-gradient(135deg, var(--tera-blue), var(--tera-cyan));
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(47, 109, 255, 0.3);
  }

  .danger-button {
    background: linear-gradient(135deg, #9f1239, #dc2626);
    color: #ffffff;
  }

  .devtools-panel {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 12px;
    background: linear-gradient(180deg, rgba(26, 26, 26, 0.72), rgba(13, 13, 13, 0.9));
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(241, 247, 255, 0.98));
    color: #10213f;
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .devtools-page {
    display: grid;
    gap: 12px;
  }

  .panel-hero {
    display: grid;
    gap: 6px;
    padding: 16px 18px;
    border: 1px solid var(--tera-border);
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(47, 109, 255, 0.16), rgba(50, 215, 255, 0.08) 58%, rgba(111, 109, 255, 0.12)),
      rgba(8, 16, 31, 0.92);
    box-shadow: 0 18px 36px rgba(2, 8, 20, 0.24);
  }

  .panel-hero-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .panel-hero-pill {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.2);
    background: rgba(7, 18, 35, 0.72);
    color: var(--tera-mist);
    font-size: 11px;
    font-family: var(--tera-code-font);
  }

  .panel-section-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .panel-section-card {
    min-height: 0;
  }

  .panel-section-card.is-full {
    grid-column: 1 / -1;
  }

  .panel-section-heading {
    margin-bottom: 10px;
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--tera-cloud);
  }

  .ai-panel {
    border: 1px solid rgba(50, 215, 255, 0.3);
    background: linear-gradient(180deg, rgba(17, 45, 94, 0.46), rgba(5, 11, 24, 0.92));
    box-shadow: 0 0 34px rgba(47, 109, 255, 0.2), 0 0 62px rgba(50, 215, 255, 0.16);
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel {
    background: linear-gradient(180deg, rgba(235, 245, 255, 0.96), rgba(225, 239, 255, 0.94));
    border-color: rgba(54, 118, 210, 0.28);
    box-shadow: 0 10px 30px rgba(63, 120, 203, 0.18);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero {
    background:
      linear-gradient(135deg, rgba(47, 109, 255, 0.08), rgba(50, 215, 255, 0.08) 58%, rgba(111, 109, 255, 0.08)),
      rgba(255, 255, 255, 0.96);
    border-color: rgba(54, 118, 210, 0.16);
    box-shadow: 0 16px 30px rgba(63, 120, 203, 0.1);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero-pill {
    background: rgba(255, 255, 255, 0.94);
    border-color: rgba(54, 118, 210, 0.16);
    color: #516178;
  }

  #terajs-devtools-root[data-theme="light"] .panel-section-heading {
    color: #10213f;
  }

  .ask-ai-button {
    background: linear-gradient(135deg, var(--tera-cyan), var(--tera-blue));
    color: #ffffff;
    border: 1px solid rgba(50, 215, 255, 0.38);
    box-shadow: 0 14px 32px rgba(50, 215, 255, 0.2);
  }

  .ai-prompt {
    display: block;
    width: 100%;
    min-height: 180px;
    border: 1px solid rgba(111, 109, 255, 0.28);
    border-radius: 14px;
    padding: 14px;
    background: rgba(8, 14, 30, 0.95);
    color: #dfe9ff;
    font-family: var(--tera-code-font);
    font-size: 13px;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 12px;
  }

  .ai-response {
    display: block;
    width: 100%;
    min-height: 120px;
    border: 1px solid rgba(50, 215, 255, 0.34);
    border-radius: 14px;
    padding: 14px;
    background: rgba(6, 16, 34, 0.96);
    color: #d7f2ff;
    font-family: var(--tera-code-font);
    font-size: 13px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 10px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-response {
    background: rgba(255, 255, 255, 0.96);
    color: #18253d;
    border-color: rgba(46, 46, 46, 0.2);
  }

  .ai-hint {
    display: block;
    margin-top: 6px;
    color: rgba(147, 167, 203, 0.96);
  }

  .component-select-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
  }

  .component-row-title {
    display: inline-block;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .component-row-meta {
    font-family: var(--tera-code-font);
    white-space: nowrap;
  }

  .component-detail-card {
    margin-top: 12px;
  }

  .components-layout {
    display: grid;
    gap: 10px;
  }

  .components-split-pane {
    display: grid;
    grid-template-columns: minmax(260px, 44%) minmax(320px, 56%);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
    overflow: hidden;
    min-height: 340px;
    background: linear-gradient(180deg, rgba(7, 18, 35, 0.84), rgba(5, 11, 24, 0.95));
  }

  #terajs-devtools-root[data-theme="light"] .components-split-pane {
    background: linear-gradient(180deg, rgba(246, 250, 255, 0.98), rgba(236, 244, 255, 0.96));
    border-color: rgba(54, 118, 210, 0.24);
  }

  .components-tree-pane,
  .components-inspector-pane {
    min-width: 0;
    min-height: 0;
    padding: 10px 12px;
    overflow: auto;
  }

  .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
  }

  #terajs-devtools-root[data-theme="light"] .components-tree-pane {
    border-right-color: rgba(54, 118, 210, 0.22);
  }

  .component-tree-toolbar {
    margin-top: 0;
    margin-bottom: 10px;
  }

  .component-tree-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }

  .component-tree-children {
    margin-top: 2px;
  }

  .component-tree-node.has-children.is-expanded > .component-tree-children {
    position: relative;
  }

  .component-tree-node.has-children.is-expanded > .component-tree-children::before {
    content: "";
    position: absolute;
    left: 19px;
    top: 0;
    bottom: 15px;
    width: 1px;
    background: rgba(47, 109, 255, 0.24);
    pointer-events: none;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-node.has-children.is-expanded > .component-tree-children::before {
    background: rgba(54, 118, 210, 0.24);
  }

  .component-tree-node {
    margin: 0;
    padding: 0;
  }

  .component-tree-row {
    display: grid;
    grid-template-columns: auto auto auto minmax(0, 1fr);
    align-items: stretch;
    gap: 0;
    min-height: 30px;
  }

  .component-tree-guides {
    display: inline-flex;
    align-items: stretch;
    gap: 0;
  }

  .tree-indent-guide {
    width: 14px;
    height: 30px;
    display: inline-block;
    position: relative;
  }

  .tree-indent-guide.is-continuing::before {
    content: "";
    position: absolute;
    left: 5px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(47, 109, 255, 0.28);
  }

  #terajs-devtools-root[data-theme="light"] .tree-indent-guide.is-continuing::before {
    background: rgba(54, 118, 210, 0.32);
  }

  .component-tree-branch {
    width: 14px;
    height: 30px;
    position: relative;
    display: inline-block;
  }

  .component-tree-branch.is-branching::before,
  .component-tree-branch.is-terminal::before {
    content: "";
    position: absolute;
    left: 5px;
    width: 1px;
    background: rgba(47, 109, 255, 0.28);
  }

  .component-tree-branch.is-branching::before {
    top: 0;
    bottom: 0;
  }

  .component-tree-branch.is-terminal::before {
    top: 0;
    height: 50%;
  }

  .component-tree-branch.is-branching::after,
  .component-tree-branch.is-terminal::after {
    content: "";
    position: absolute;
    left: 5px;
    right: 0;
    top: calc(50% - 0.5px);
    height: 1px;
    background: rgba(47, 109, 255, 0.28);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-branch.is-branching::before,
  #terajs-devtools-root[data-theme="light"] .component-tree-branch.is-terminal::before,
  #terajs-devtools-root[data-theme="light"] .component-tree-branch.is-branching::after,
  #terajs-devtools-root[data-theme="light"] .component-tree-branch.is-terminal::after {
    background: rgba(54, 118, 210, 0.32);
  }

  .component-tree-toggle {
    appearance: none;
    width: 14px;
    min-width: 14px;
    height: 30px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--tera-blue);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    line-height: 1;
    display: inline-grid;
    place-items: center;
    padding: 0;
    align-self: stretch;
    transition: color 140ms ease;
  }

  .component-tree-chevron {
    width: 14px;
    display: inline-grid;
    place-items: center;
  }

  .component-tree-toggle:hover {
    color: #a9c2ff;
  }

  .component-tree-toggle.is-placeholder {
    cursor: default;
    opacity: 0;
    pointer-events: none;
  }

  .component-tree-select {
    appearance: none;
    width: 100%;
    border: 1px solid rgba(47, 109, 255, 0.08);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(12, 20, 37, 0.64), rgba(7, 13, 24, 0.54));
    color: var(--tera-cloud);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    min-height: 38px;
    padding: 5px 10px 5px 6px;
    cursor: pointer;
    text-align: left;
    transition: background 140ms ease, border-color 140ms ease, transform 120ms ease;
  }

  .component-tree-select:hover {
    background: linear-gradient(180deg, rgba(22, 36, 64, 0.82), rgba(11, 21, 40, 0.74));
    border-color: rgba(47, 109, 255, 0.34);
    transform: translateX(1px);
  }

  .component-tree-select.is-active {
    background: linear-gradient(180deg, rgba(39, 71, 135, 0.88), rgba(24, 46, 91, 0.92));
    border-color: rgba(116, 160, 255, 0.64);
    box-shadow: inset 0 0 0 1px rgba(139, 181, 255, 0.12);
    color: #eef4ff;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select {
    color: #10213f;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(242, 247, 255, 0.98));
    border-color: rgba(54, 118, 210, 0.14);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select.is-active {
    color: #0d2a57;
    background: linear-gradient(180deg, rgba(209, 228, 255, 0.92), rgba(193, 219, 255, 0.9));
    border-color: rgba(54, 118, 210, 0.32);
    box-shadow: inset 0 0 0 1px rgba(54, 118, 210, 0.08);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select:hover {
    background: linear-gradient(180deg, rgba(236, 245, 255, 0.98), rgba(226, 238, 255, 0.98));
  }

  .component-tree-content {
    min-width: 0;
    flex: 1;
    display: grid;
    gap: 2px;
  }

  .component-tree-label-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .component-tree-label {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 600;
  }

  .component-tree-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 18px;
    padding: 0 7px;
    border-radius: 999px;
    background: rgba(50, 215, 255, 0.12);
    border: 1px solid rgba(50, 215, 255, 0.16);
    color: var(--tera-cyan);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .component-tree-badge.is-root {
    background: rgba(47, 109, 255, 0.18);
    border-color: rgba(116, 160, 255, 0.22);
    color: #cfe0ff;
  }

  .component-tree-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    letter-spacing: 0.01em;
  }

  .component-tree-instance {
    font-family: var(--tera-code-font);
    opacity: 0.82;
    font-size: 11px;
    white-space: nowrap;
  }

  .component-ai-hint {
    margin-left: 44px;
    margin-top: 2px;
    margin-bottom: 4px;
    font-size: 11px;
  }

  .inspector-cascade {
    display: grid;
    gap: 12px;
  }

  .inspector-cascade-block {
    display: grid;
    gap: 8px;
    border-left: 1px solid var(--tera-border);
    padding-left: 10px;
  }

  .inspector-cascade-title {
    color: var(--tera-cloud);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.01em;
    text-transform: none;
  }

  .inspector-keyvalue-list {
    display: grid;
    gap: 4px;
  }

  .inspector-keyvalue-row {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 10px;
    font-size: 12px;
    line-height: 1.35;
  }

  .inspector-keyvalue-key {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
  }

  .inspector-keyvalue-value {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    overflow-wrap: anywhere;
  }

  .inspector-ai-panel {
    display: grid;
    gap: 12px;
  }

  .inspector-ai-block {
    display: grid;
    gap: 8px;
  }

  .inspector-ai-title {
    color: var(--tera-mist);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .inspector-ai-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .inspector-ai-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.24);
    background: rgba(50, 215, 255, 0.1);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.2;
  }

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
    justify-content: center;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.24);
    background: rgba(50, 215, 255, 0.1);
    color: var(--tera-cyan);
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
    border-radius: 999px;
    background: rgba(50, 215, 255, 0.12);
    color: var(--tera-cyan);
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
    background: linear-gradient(180deg, rgba(244, 249, 255, 0.98), rgba(234, 242, 255, 0.96));
    border-color: rgba(54, 118, 210, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-title {
    color: #10213f;
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-caption {
    color: #5f718d;
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-count {
    border-color: rgba(54, 118, 210, 0.22);
    background: rgba(54, 118, 210, 0.08);
    color: #0a57cc;
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll {
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-item {
    background: rgba(255, 255, 255, 0.92);
    border-color: rgba(54, 118, 210, 0.16);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-badge {
    background: rgba(54, 118, 210, 0.1);
    color: #0a57cc;
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-text {
    color: #10213f;
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-empty {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(54, 118, 210, 0.2);
    color: #5f718d;
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-pill {
    background: rgba(255, 255, 255, 0.94);
    border-color: rgba(54, 118, 210, 0.16);
    color: #5f718d;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-badge {
    background: rgba(54, 118, 210, 0.08);
    border-color: rgba(54, 118, 210, 0.14);
    color: #0a57cc;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-badge.is-root {
    background: rgba(47, 109, 255, 0.12);
    border-color: rgba(54, 118, 210, 0.16);
    color: #0d2a57;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-meta {
    color: #5f718d;
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

  .inspector-live-input:focus {
    outline: 2px solid rgba(50, 215, 255, 0.36);
    outline-offset: 1px;
  }

  .inspector-toggle-button {
    min-width: 76px;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .reactive-feed-item {
    align-items: flex-start;
  }

  .value-explorer {
    display: grid;
    gap: 2px;
    min-width: 0;
    max-width: 100%;
  }

  .value-node,
  .value-leaf {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .value-node-toggle,
  .value-leaf {
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    font: inherit;
    font-size: 12px;
    color: var(--tera-mist);
    min-width: 0;
    max-width: 100%;
  }

  .value-node-toggle {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .value-node-toggle:hover {
    background: rgba(50, 215, 255, 0.06);
  }

  .value-node-chevron {
    color: var(--tera-cyan);
    width: 12px;
    display: inline-grid;
    place-items: center;
  }

  .value-key {
    min-width: 0;
    overflow-wrap: anywhere;
    font-family: var(--tera-code-font);
    color: var(--tera-cloud);
  }

  .value-type {
    justify-self: end;
    color: var(--tera-mist);
    font-size: 11px;
    font-family: var(--tera-code-font);
  }

  .value-separator {
    color: var(--tera-mist);
    justify-self: center;
  }

  .value-node-children {
    display: grid;
    gap: 2px;
    padding: 0 0 0 16px;
    min-width: 0;
    max-width: 100%;
  }

  .value-preview {
    grid-column: 3;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    overflow-wrap: anywhere;
  }

  .value-empty {
    padding: 2px 0;
    background: transparent;
    border: 0;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown {
    border-color: rgba(54, 118, 210, 0.22);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-origin {
    color: #0b4fa8;
    border-color: rgba(54, 118, 210, 0.28);
    background: rgba(54, 118, 210, 0.08);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-live-input {
    background: rgba(255, 255, 255, 0.96);
    border-color: rgba(54, 118, 210, 0.22);
    color: #10213f;
  }

  .inspector-section {
    border-left: 1px solid var(--tera-border);
    border-radius: 0;
    background: transparent;
    overflow: visible;
    padding-left: 10px;
    min-width: 0;
    max-width: 100%;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section {
    border-color: rgba(54, 118, 210, 0.22);
  }

  .inspector-section-toggle {
    width: 100%;
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--tera-cloud);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .inspector-section-toggle:hover {
    color: #e9f7ff;
  }

  .inspector-section-chevron {
    width: 14px;
    color: var(--tera-cyan);
    font-size: 12px;
    display: inline-grid;
    place-items: center;
  }

  .inspector-section-heading {
    min-width: 0;
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .inspector-section-title {
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .inspector-section-summary {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-summary {
    color: #5f718d;
  }

  .inspector-section-body {
    padding: 2px 0 6px 14px;
    display: grid;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-code {
    margin: 0;
    border: 1px solid rgba(50, 215, 255, 0.3);
    border-radius: 10px;
    background: rgba(4, 9, 19, 0.94);
    padding: 10px;
    color: #dff5ff;
    max-height: 220px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.44;
  }

  .inspector-json {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
    overflow-x: hidden;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-code {
    background: rgba(242, 248, 255, 0.96);
    color: #10213f;
    border-color: rgba(54, 118, 210, 0.28);
  }

  .inspector-grid {
    display: grid;
    gap: 6px;
    font-size: 12px;
  }

  @media (min-width: 901px) {
    .devtools-shell {
      --tera-sidebar-width: 148px;
      --tera-components-tree-width: clamp(280px, 34vw, 420px);
      --tera-components-column-padding: 14px;
    }

    .devtools-body {
      flex-direction: row;
    }

    .components-screen {
      grid-template-columns: var(--tera-sidebar-width) var(--tera-components-tree-width) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
    }

    .components-screen-sidebar {
      grid-column: 1;
      grid-row: 1;
    }

    .components-screen-sidebar .devtools-tabs {
      width: 100%;
      height: 100%;
    }

    .components-screen-tree {
      grid-column: 2;
      grid-row: 1;
      border-right: 1px solid var(--tera-border);
      border-bottom: 0;
    }

    .components-screen-inspector {
      grid-column: 3;
      grid-row: 1;
    }

    .components-screen-header-row {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }

    .components-screen-search,
    .components-screen-filter {
      width: min(270px, 52%);
    }

    .devtools-tabs {
      width: 132px;
      border-right: 1px solid var(--tera-border);
      border-bottom: 0;
      flex-direction: column;
      overflow: auto;
      padding: 8px;
    }

    .panel-section-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .metrics-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .panel-title {
    font-family: var(--tera-heading-font);
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .is-blue { color: #0a57cc; }
  #terajs-devtools-root[data-theme="light"] .is-green { color: #007e96; }
  #terajs-devtools-root[data-theme="light"] .is-purple { color: #5a43bc; }
  #terajs-devtools-root[data-theme="light"] .is-red { color: #b2204f; }
  #terajs-devtools-root[data-theme="light"] .is-cyan { color: #007da8; }
  #terajs-devtools-root[data-theme="light"] .is-amber { color: #8a5100; }

  .is-blue { color: var(--tera-blue); }
  .is-green { color: var(--tera-cyan); }
  .is-purple { color: var(--tera-purple); }
  .is-red { color: #ff6b8b; }
  .is-cyan { color: var(--tera-cyan); }
  .is-amber { color: #ffc56a; }

  .empty-state {
    padding: 12px 0;
    color: rgba(179, 179, 179, 0.72);
    font-size: 13px;
  }

  #terajs-devtools-root[data-theme="light"] .empty-state {
    color: rgba(46, 46, 46, 0.56);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-ai-tag {
    border-color: rgba(0, 125, 168, 0.2);
    background: rgba(0, 125, 168, 0.1);
    color: #164a5c;
  }

  .stack-list {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 360px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .stack-list {
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .compact-list {
    max-height: 180px;
  }

  .log-list {
    max-height: 320px;
  }

  .stack-item,
  .detail-card,
  .metric-card {
    background: var(--tera-panel-glow), rgba(26, 26, 26, 0.96);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .stack-item,
  #terajs-devtools-root[data-theme="light"] .detail-card,
  #terajs-devtools-root[data-theme="light"] .metric-card {
    background: linear-gradient(145deg, rgba(47, 109, 255, 0.06), rgba(50, 215, 255, 0.05) 52%, rgba(255, 255, 255, 0.94));
    border-color: rgba(46, 46, 46, 0.12);
  }

  .stack-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .inspector-cascade .stack-item {
    background: transparent;
    border: 0;
    border-left: 1px solid rgba(50, 215, 255, 0.18);
    border-radius: 0;
    padding: 2px 0 2px 10px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-cascade .stack-item {
    border-left-color: rgba(54, 118, 210, 0.22);
  }

  .item-label,
  .accent-text {
    font-weight: 700;
  }

  .item-label,
  .metric-value,
  .tiny-muted {
    font-family: var(--tera-code-font);
  }

  .issue-error {
    border-color: rgba(255, 107, 139, 0.28);
    background: linear-gradient(145deg, rgba(255, 107, 139, 0.16), rgba(26, 26, 26, 0.98));
    color: #ffd6de;
  }

  .issue-warn {
    border-color: rgba(255, 197, 106, 0.28);
    background: linear-gradient(145deg, rgba(255, 197, 106, 0.16), rgba(26, 26, 26, 0.98));
    color: #ffe6b0;
  }

  #terajs-devtools-root[data-theme="light"] .issue-error {
    background: linear-gradient(145deg, rgba(255, 107, 139, 0.12), rgba(255, 255, 255, 0.96));
    color: #8a1738;
  }

  #terajs-devtools-root[data-theme="light"] .issue-warn {
    background: linear-gradient(145deg, rgba(255, 197, 106, 0.12), rgba(255, 255, 255, 0.96));
    color: #8a5400;
  }

  .timeline-active {
    border-left: 3px solid var(--tera-cyan);
  }

  .timeline-inactive {
    opacity: 0.7;
  }

  .performance-item {
    border-left: 3px solid var(--tera-purple);
  }

  .button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    margin: 12px 0;
  }

  .metric-value {
    margin-top: 6px;
    font-size: 18px;
    font-weight: 700;
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .metric-value {
    color: #181818;
  }

  .range-wrap {
    margin: 12px 0;
  }

  .timeline-slider {
    width: 100%;
    accent-color: var(--tera-blue);
  }

  .devtools-panel::-webkit-scrollbar,
  .devtools-tabs::-webkit-scrollbar,
  .stack-list::-webkit-scrollbar,
  .ai-prompt::-webkit-scrollbar,
  .ai-response::-webkit-scrollbar,
  .runtime-history-scroll::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .devtools-panel::-webkit-scrollbar-track,
  .devtools-tabs::-webkit-scrollbar-track,
  .stack-list::-webkit-scrollbar-track,
  .ai-prompt::-webkit-scrollbar-track,
  .ai-response::-webkit-scrollbar-track,
  .runtime-history-scroll::-webkit-scrollbar-track {
    background: rgba(9, 20, 39, 0.46);
    border-radius: 999px;
  }

  .devtools-panel::-webkit-scrollbar-thumb,
  .devtools-tabs::-webkit-scrollbar-thumb,
  .stack-list::-webkit-scrollbar-thumb,
  .ai-prompt::-webkit-scrollbar-thumb,
  .ai-response::-webkit-scrollbar-thumb,
  .runtime-history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(55, 139, 255, 0.88), rgba(50, 215, 255, 0.76));
    border-radius: 999px;
    border: 2px solid rgba(9, 20, 39, 0.46);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll::-webkit-scrollbar-track {
    background: rgba(206, 220, 243, 0.88);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(64, 126, 213, 0.9), rgba(39, 174, 217, 0.86));
    border-color: rgba(206, 220, 243, 0.88);
  }
`;

