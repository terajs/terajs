import { componentTreeStyles } from "./componentTreeStyles.js";

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
    --tera-light-text-strong: var(--tera-light-cyan-ink);
    --tera-light-text-soft: #5f5ed9;
    --tera-light-text-muted: #746fe8;
    --tera-light-accent: #2f6dff;
    --tera-light-accent-strong: #1f58d6;
    --tera-light-accent-violet: #5a4fd4;
    --tera-light-accent-soft: rgba(47, 109, 255, 0.14);
    --tera-light-accent-soft-strong: rgba(47, 109, 255, 0.22);
    --tera-light-border: rgba(79, 140, 255, 0.28);
    --tera-light-border-strong: rgba(88, 201, 255, 0.34);
    --tera-light-shell-bg:
      radial-gradient(circle at 0% 0%, rgba(47, 109, 255, 0.24), transparent 30%),
      radial-gradient(circle at 92% 8%, rgba(90, 79, 212, 0.2), transparent 26%),
      radial-gradient(circle at 70% 32%, rgba(50, 215, 255, 0.16), transparent 24%),
      linear-gradient(180deg, rgba(251, 254, 255, 0.99), rgba(230, 242, 255, 0.98));
    --tera-light-panel-bg:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.12), transparent 34%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.11), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(235, 245, 255, 0.98));
    --tera-light-panel-alt:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.14), transparent 32%),
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.1), transparent 28%),
      linear-gradient(180deg, rgba(247, 252, 255, 0.99), rgba(226, 238, 255, 0.97));
    --tera-light-panel-emphasis:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.18), transparent 38%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.14), transparent 30%),
      linear-gradient(180deg, rgba(238, 246, 255, 0.99), rgba(216, 225, 255, 0.97));
    --tera-light-panel-raised: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(236, 246, 255, 0.96));
    --tera-light-panel-raised-soft: linear-gradient(180deg, rgba(248, 252, 255, 0.98), rgba(231, 241, 255, 0.97));
    --tera-light-shadow: 0 18px 38px rgba(47, 109, 255, 0.16), 0 0 26px rgba(90, 79, 212, 0.12);
    --tera-light-cyan-ink: #0b7ea6;
    --tera-light-purple-ink: #5647c8;
    --tera-light-red-ink: #b2204f;
    --tera-light-amber-ink: #8a5100;
    --tera-light-mint-ink: #0f8d77;
    color: var(--tera-light-text-strong);
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
    --panel-bg: var(--tera-light-shell-bg);
  }

  .devtools-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--tera-border);
    background:
      linear-gradient(120deg, rgba(47, 109, 255, 0.18), rgba(50, 215, 255, 0.1) 58%, transparent),
      rgba(13, 19, 32, 0.94);
    backdrop-filter: blur(14px);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-header {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.18), transparent 36%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.16), transparent 30%),
      radial-gradient(circle at center, rgba(50, 215, 255, 0.08), transparent 46%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(235, 245, 255, 0.93));
    border-bottom-color: var(--tera-light-border);
  }

  .devtools-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }

  .devtools-host-controls-panel {
    display: grid;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(8, 17, 34, 0.9), rgba(7, 14, 28, 0.94));
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-panel {
    border-bottom-color: var(--tera-light-border);
    background: linear-gradient(180deg, rgba(247, 251, 255, 0.98), rgba(237, 245, 255, 0.96));
  }

  .devtools-host-controls-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .devtools-host-controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .devtools-host-controls-section {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid rgba(50, 215, 255, 0.16);
    border-radius: 12px;
    background: rgba(10, 20, 38, 0.54);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-section {
    border-color: var(--tera-light-border);
    background: rgba(255, 255, 255, 0.88);
  }

  .devtools-host-controls-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-title {
    color: var(--tera-light-text-strong);
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
    color: var(--tera-light-text-strong);
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
    color: var(--tera-light-text-muted);
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

  .components-screen.is-inspector-hidden {
    grid-template-rows: auto minmax(0, 1fr);
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

  .components-screen.is-inspector-hidden .components-screen-tree {
    border-right: 0;
    border-bottom: 0;
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
    background: var(--tera-light-panel-raised);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-search:focus,
  #terajs-devtools-root[data-theme="light"] .components-screen-filter:focus {
    border-color: var(--tera-light-accent);
    box-shadow: 0 0 0 1px rgba(47, 109, 255, 0.18), 0 10px 22px rgba(47, 109, 255, 0.08);
  }

  .components-screen-header .component-tree-toolbar {
    margin-bottom: 0;
  }

  .components-screen-tree .components-screen-search {
    width: 100%;
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
    border-bottom-color: var(--tera-light-border-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-path {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-meta {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen {
    background: var(--tera-light-shell-bg);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree,
  #terajs-devtools-root[data-theme="light"] .components-screen-inspector {
    background: var(--tera-light-panel-bg);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree {
    background: var(--tera-light-panel-alt);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-header {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.12), transparent 34%),
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.08), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(239, 246, 255, 0.88));
    border-bottom-color: var(--tera-light-border);
  }

  .components-screen-tree .components-screen-header {
    background: linear-gradient(180deg, rgba(22, 37, 71, 0.84), rgba(12, 20, 38, 0.78));
    border-bottom-color: rgba(47, 109, 255, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree .components-screen-header {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.14), transparent 42%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.12), transparent 32%),
      var(--tera-light-panel-emphasis);
    border-bottom-color: var(--tera-light-border-strong);
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
    background: linear-gradient(180deg, rgba(243, 248, 255, 0.99), rgba(230, 240, 255, 0.97));
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
    background: rgba(255, 255, 255, 0.94);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button:hover,
  #terajs-devtools-root[data-theme="light"] .toolbar-button:hover,
  #terajs-devtools-root[data-theme="light"] .filter-button:hover,
  #terajs-devtools-root[data-theme="light"] .select-button:hover {
    border-color: var(--tera-light-border-strong);
    background: rgba(255, 255, 255, 0.96);
    color: var(--tera-light-accent-strong);
    transform: none;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button.is-active,
  #terajs-devtools-root[data-theme="light"] .filter-button.is-active,
  #terajs-devtools-root[data-theme="light"] .toolbar-button.is-active,
  #terajs-devtools-root[data-theme="light"] .select-button.is-selected {
    background: rgba(255, 255, 255, 0.94);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
    box-shadow: inset 0 0 0 1px rgba(79, 140, 255, 0.16);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs .tab-button.is-active {
    background: linear-gradient(180deg, #2b6edc, #1a4daa);
    color: #ffffff;
    border-color: rgba(26, 77, 170, 0.72);
    box-shadow: 0 12px 24px rgba(31, 88, 214, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs .tab-button.is-active:hover {
    background: linear-gradient(180deg, #2f76e8, #1c56bc);
    color: #ffffff;
    transform: none;
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

  .devtools-panel-iframe-shell {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .devtools-panel-iframe {
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 100%;
    border: 0;
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel {
    background: var(--tera-light-shell-bg);
    color: var(--tera-light-text-strong);
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
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
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.16), transparent 36%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.14), transparent 28%),
      linear-gradient(180deg, rgba(238, 246, 255, 0.98), rgba(221, 235, 255, 0.96));
    border-color: var(--tera-light-border-strong);
    box-shadow: var(--tera-light-shadow);
  }

  .ai-workbench-shell {
    padding: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.12), transparent 26%),
      radial-gradient(circle at center, rgba(90, 79, 212, 0.08), transparent 36%),
      linear-gradient(180deg, rgba(10, 18, 33, 0.98), rgba(5, 9, 18, 0.98));
  }

  .ai-workbench-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .ai-workbench-pane {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.9), rgba(5, 9, 18, 0.96));
    border-bottom: 1px solid var(--tera-border);
  }

  .ai-workbench-pane:last-child {
    border-bottom: 0;
  }

  .ai-workbench-rail {
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .ai-workbench-main {
    background: linear-gradient(180deg, rgba(11, 23, 45, 0.94), rgba(6, 12, 25, 0.98));
  }

  .ai-workbench-body {
    display: grid;
    gap: 14px;
    align-content: flex-start;
  }

  .ai-workbench-block {
    display: grid;
    gap: 8px;
  }

  .ai-workbench-message-card {
    margin: 0;
  }

  .ai-workbench-details {
    border: 1px solid rgba(50, 215, 255, 0.2);
    border-radius: 14px;
    background: rgba(7, 18, 35, 0.56);
    overflow: hidden;
  }

  .ai-workbench-details summary {
    cursor: pointer;
    list-style: none;
    padding: 12px 14px;
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .ai-workbench-details summary::-webkit-details-marker {
    display: none;
  }

  .ai-workbench-details-body {
    padding: 0 14px 14px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-shell {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.14), transparent 26%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.1), transparent 24%),
      radial-gradient(circle at center right, rgba(50, 215, 255, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(247, 252, 255, 0.99), rgba(226, 238, 255, 0.97));
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-pane {
    background: var(--tera-light-panel-bg);
    color: var(--tera-light-text-strong);
    border-bottom-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-rail {
    background: var(--tera-light-panel-alt);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-main {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.94));
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-details {
    background: var(--tera-light-panel-raised-soft);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-details summary {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero {
    background:
      linear-gradient(135deg, rgba(47, 109, 255, 0.14), rgba(90, 79, 212, 0.1) 42%, rgba(50, 215, 255, 0.08) 68%),
      rgba(255, 255, 255, 0.97);
    border-color: var(--tera-light-border);
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

  .ai-prompt {
    display: block;
    width: 100%;
    min-height: 180px;
    border: 1px solid var(--tera-border);
    border-radius: 8px;
    padding: 14px;
    background: rgba(4, 9, 19, 0.92);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 13px;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .ai-prompt {
    background: var(--tera-light-panel-raised-soft);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
  }

  .ai-response {
    display: block;
    width: 100%;
    min-height: 120px;
    border: 1px solid var(--tera-border);
    border-radius: 8px;
    padding: 14px;
    background: rgba(4, 9, 19, 0.92);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 13px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .ai-response {
    background: var(--tera-light-panel-raised-soft);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
  }

  .ai-hint {
    display: block;
    margin-top: 6px;
    color: rgba(147, 167, 203, 0.96);
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
    padding: var(--tera-components-column-padding) 12px;
  }

  .ai-diagnostics-layout .ai-diagnostics-detail-pane .components-screen-header {
    flex: 0 0 auto;
  }

  .ai-diagnostics-layout .ai-diagnostics-detail-pane .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--tera-components-column-padding) 12px;
  }

  .ai-diagnostics-layout .components-tree-pane {
    border-right: 0;
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .ai-diagnostics-layout .components-inspector-pane {
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.86), rgba(5, 9, 18, 0.92));
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-tree-pane {
    border-bottom-color: var(--tera-light-border);
    background: var(--tera-light-panel-alt);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-inspector-pane {
    background: var(--tera-light-panel-bg);
  }

  .ai-diagnostics-nav-list {
    display: grid;
    gap: 1px;
  }

  .ai-diagnostics-nav-button {
    appearance: none;
    width: 100%;
    justify-self: stretch;
    position: relative;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--component-tree-label-dark);
    display: grid;
    gap: 2px;
    min-height: 26px;
    padding: 3px 14px;
    cursor: pointer;
    text-align: left;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  }

  .ai-diagnostics-nav-button::before {
    content: "";
    position: absolute;
    left: -10px;
    top: 4px;
    bottom: 4px;
    width: 3px;
    border-radius: 999px;
    background: rgba(97, 156, 255, 0.24);
    opacity: 1;
    transition: background 140ms ease;
  }

  .ai-diagnostics-nav-button:hover {
    background: var(--component-tree-hover-dark);
    color: #f3fff8;
  }

  .ai-diagnostics-nav-button.is-active {
    background: var(--component-tree-active-dark);
    box-shadow: inset 2px 0 0 var(--component-tree-accent-dark);
    color: #f4f8ff;
  }

  .ai-diagnostics-nav-button:hover::before,
  .ai-diagnostics-nav-button.is-active::before {
    background: var(--component-tree-accent-dark);
  }

  .ai-diagnostics-nav-title {
    font-family: var(--tera-code-font);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1.2;
  }

  .ai-diagnostics-nav-summary {
    color: var(--component-tree-meta-dark);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.25;
  }

  .ai-diagnostics-nav-button.is-active .ai-diagnostics-nav-summary {
    color: rgba(223, 239, 255, 0.82);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button {
    color: var(--component-tree-label-light);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button:hover {
    background: var(--component-tree-hover-light);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active {
    background: var(--component-tree-active-light);
    box-shadow: inset 2px 0 0 var(--component-tree-accent-light);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button::before {
    background: rgba(73, 126, 255, 0.24);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button:hover::before,
  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active::before {
    background: var(--component-tree-accent-light);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-summary {
    color: var(--component-tree-meta-light);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active .ai-diagnostics-nav-summary {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-title {
    text-shadow: 0 0 10px rgba(50, 215, 255, 0.12);
  }

  .ai-diagnostics-detail-stack,
  .ai-diagnostics-section-block {
    display: grid;
    gap: 10px;
  }

  .meta-panel-layout {
    grid-template-columns: minmax(180px, 31%) minmax(0, 69%);
    grid-template-rows: minmax(0, 1fr);
  }

  .meta-panel-layout .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
    border-bottom: 0;
  }

  #terajs-devtools-root[data-theme="light"] .meta-panel-layout .components-tree-pane {
    border-right-color: var(--tera-light-border);
  }

  .meta-panel-layout .meta-panel-nav-pane .components-screen-body {
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .issues-panel-layout .ai-diagnostics-nav-pane .components-screen-body,
  .logs-panel-layout .ai-diagnostics-nav-pane .components-screen-body {
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .issues-panel-layout,
  .logs-panel-layout {
    grid-template-columns: minmax(220px, 30%) minmax(0, 70%);
    grid-template-rows: minmax(0, 1fr);
  }

  .issues-panel-layout .components-tree-pane,
  .logs-panel-layout .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
    border-bottom: 0;
  }

  #terajs-devtools-root[data-theme="light"] .issues-panel-layout .components-tree-pane,
  #terajs-devtools-root[data-theme="light"] .logs-panel-layout .components-tree-pane {
    border-right-color: var(--tera-light-border);
  }

  .iframe-single-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 360px;
    height: calc(100% + 24px);
    margin: -12px;
    padding: 0;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.86), rgba(5, 9, 18, 0.92));
  }

  .iframe-single-panel .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--tera-components-column-padding) 12px;
  }

  #terajs-devtools-root[data-theme="light"] .iframe-single-panel {
    background: var(--tera-light-panel-bg);
  }

  @media (max-width: 520px) {
    .meta-panel-layout {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }

    .meta-panel-layout .components-tree-pane {
      border-right: 0;
      border-bottom: 1px solid var(--tera-border);
    }

    #terajs-devtools-root[data-theme="light"] .meta-panel-layout .components-tree-pane {
      border-bottom-color: var(--tera-light-border);
    }
  }

  .signals-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(160px, auto) minmax(0, 1fr);
    min-height: 360px;
    height: calc(100% + 24px);
    margin: -12px;
    overflow: hidden;
  }

  .signals-summary-pane,
  .signals-detail-pane {
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .signals-summary-pane .components-screen-body,
  .signals-detail-pane .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--tera-components-column-padding) 12px;
  }

  .signals-summary-pane {
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .signals-detail-pane {
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.86), rgba(5, 9, 18, 0.92));
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-pane {
    border-bottom-color: var(--tera-light-border);
    background: var(--tera-light-panel-alt);
  }

  #terajs-devtools-root[data-theme="light"] .signals-detail-pane {
    background: var(--tera-light-panel-bg);
  }

  .signals-summary-list,
  .signals-detail-stack,
  .meta-panel-detail-stack,
  .iframe-panel-stack {
    display: grid;
    gap: 10px;
  }

  .signals-summary-row,
  .signals-section-block,
  .meta-panel-section-block,
  .iframe-panel-section-block {
    display: grid;
    gap: 8px;
    border: 1px solid var(--tera-border);
    border-radius: 8px;
    background: rgba(10, 20, 38, 0.34);
    padding: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-row,
  #terajs-devtools-root[data-theme="light"] .signals-section-block,
  #terajs-devtools-root[data-theme="light"] .meta-panel-section-block,
  #terajs-devtools-root[data-theme="light"] .iframe-panel-section-block {
    border-color: var(--tera-light-border);
    background: rgba(255, 255, 255, 0.58);
  }

  .signals-summary-label,
  .signals-section-heading,
  .meta-panel-section-heading,
  .iframe-panel-section-heading {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-label,
  #terajs-devtools-root[data-theme="light"] .signals-section-heading,
  #terajs-devtools-root[data-theme="light"] .meta-panel-section-heading,
  #terajs-devtools-root[data-theme="light"] .iframe-panel-section-heading {
    color: var(--tera-light-text-strong);
  }

  .signals-summary-value {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
  }

  .signals-summary-note {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.4;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-value {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-note {
    color: var(--tera-light-text-muted);
  }

  .iframe-results-pane {
    min-width: 0;
  }

  .iframe-results-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .iframe-results-item {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid rgba(50, 215, 255, 0.16);
    border-radius: 10px;
    background: rgba(6, 14, 28, 0.56);
    min-width: 0;
  }

  .iframe-results-item.is-error {
    border-color: rgba(255, 107, 139, 0.26);
    background: linear-gradient(180deg, rgba(62, 16, 28, 0.52), rgba(12, 12, 18, 0.72));
  }

  .iframe-results-item.is-warn {
    border-color: rgba(255, 197, 106, 0.24);
    background: linear-gradient(180deg, rgba(62, 40, 12, 0.48), rgba(12, 12, 18, 0.72));
  }

  .iframe-results-item-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .iframe-results-item-title {
    color: var(--tera-cloud);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.45;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .iframe-results-item-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.4;
    white-space: nowrap;
  }

  .iframe-results-item-summary {
    color: rgba(227, 238, 255, 0.76);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .timeline-control-panel {
    display: grid;
    gap: 10px;
  }

  .timeline-control-summary {
    display: grid;
    gap: 4px;
  }

  .timeline-control-count {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    font-weight: 700;
  }

  .timeline-control-note {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.45;
  }

  .signals-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    max-height: 420px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  .signals-list-compact {
    max-height: 360px;
  }

  #terajs-devtools-root[data-theme="light"] .signals-list {
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .signals-list-item {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-left: 2px solid var(--tera-cyan);
    background: rgba(7, 18, 35, 0.3);
  }

  #terajs-devtools-root[data-theme="light"] .signals-list-item {
    border-left-color: var(--tera-light-accent);
    background: rgba(47, 109, 255, 0.04);
  }

  .signals-list-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .signals-list-preview {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  #terajs-devtools-root[data-theme="light"] .signals-list-preview {
    color: var(--tera-light-text-strong);
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
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.16), transparent 30%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.14), transparent 26%),
      radial-gradient(circle at center right, rgba(50, 215, 255, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(247, 252, 255, 0.99), rgba(226, 238, 255, 0.97));
    border-color: var(--tera-light-border-strong);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76), 0 18px 34px rgba(47, 109, 255, 0.12), 0 0 26px rgba(50, 215, 255, 0.08);
  }

  .components-tree-pane,
  .components-inspector-pane {
    min-width: 0;
    min-height: 0;
    padding: 10px 12px;
    overflow: auto;
  }

${componentTreeStyles}

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

  #terajs-devtools-root[data-theme="light"] .inspector-cascade-title {
    color: var(--tera-light-text-strong);
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

  #terajs-devtools-root[data-theme="light"] .inspector-keyvalue-key {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-keyvalue-value {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-ai-title {
    color: var(--tera-light-text-muted);
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
    background: var(--tera-light-panel-alt);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-caption {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-count {
    border-color: var(--tera-light-border);
    background: var(--tera-light-accent-soft);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll {
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-item {
    background: var(--tera-light-panel-raised);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-badge {
    background: var(--tera-light-accent-soft);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-text {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-empty {
    background: var(--tera-light-panel-raised-soft);
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-pill {
    background: rgba(255, 255, 255, 0.86);
    border-color: var(--tera-light-border);
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
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-origin {
    color: var(--tera-light-accent-strong);
    border-color: var(--tera-light-border-strong);
    background: var(--tera-light-accent-soft);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-summary::before {
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-key {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-type {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-inline-value {
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-live-input {
    background: var(--tera-light-panel-raised);
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-strong);
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
    border-color: var(--tera-light-border);
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

  #terajs-devtools-root[data-theme="light"] .inspector-section-toggle {
    color: var(--tera-light-text-strong);
    border-radius: 6px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-toggle:hover {
    color: var(--tera-light-accent-strong);
    background: linear-gradient(90deg, rgba(47, 109, 255, 0.08), rgba(90, 79, 212, 0.06), rgba(50, 215, 255, 0.03));
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

  #terajs-devtools-root[data-theme="light"] .inspector-section-chevron {
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-title {
    color: var(--tera-light-text-strong);
  }

  .inspector-section-summary {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-summary {
    color: var(--tera-light-text-muted);
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
    background: var(--tera-light-panel-raised-soft);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
  }

  .inspector-grid {
    display: grid;
    gap: 6px;
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .value-node-toggle,
  #terajs-devtools-root[data-theme="light"] .value-leaf {
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .value-node-toggle:hover {
    background: linear-gradient(90deg, rgba(47, 109, 255, 0.08), rgba(90, 79, 212, 0.06), rgba(50, 215, 255, 0.03));
  }

  #terajs-devtools-root[data-theme="light"] .value-node-chevron {
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .value-key {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .value-type,
  #terajs-devtools-root[data-theme="light"] .value-separator,
  #terajs-devtools-root[data-theme="light"] .value-preview,
  #terajs-devtools-root[data-theme="light"] .value-empty {
    color: var(--tera-light-text-muted);
  }

  @media (min-width: 901px) {
    .devtools-shell {
      --tera-sidebar-width: 136px;
      --tera-components-tree-width: clamp(240px, 28vw, 320px);
      --tera-components-column-padding: 14px;
    }

    .devtools-body {
      flex-direction: row;
    }

    .components-screen {
      grid-template-columns: var(--tera-sidebar-width) var(--tera-components-tree-width) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
    }

    .components-screen.is-inspector-hidden {
      grid-template-columns: var(--tera-sidebar-width) minmax(0, 1fr);
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

    .components-screen-tree .components-screen-search {
      width: 100%;
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

    .ai-diagnostics-layout {
      grid-template-columns: minmax(250px, 33%) minmax(0, 67%);
      grid-template-rows: minmax(0, 1fr);
    }

    .signals-layout {
      grid-template-columns: minmax(250px, 33%) minmax(0, 67%);
      grid-template-rows: minmax(0, 1fr);
    }

    .ai-diagnostics-layout .components-tree-pane {
      border-right: 1px solid rgba(50, 215, 255, 0.26);
      border-bottom: 0;
    }

    .signals-summary-pane {
      border-right: 1px solid rgba(50, 215, 255, 0.26);
      border-bottom: 0;
    }

    #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-tree-pane {
      border-right-color: var(--tera-light-border);
    }

    #terajs-devtools-root[data-theme="light"] .signals-summary-pane {
      border-right-color: var(--tera-light-border);
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

  #terajs-devtools-root[data-theme="light"] .panel-title.is-blue,
  #terajs-devtools-root[data-theme="light"] .panel-title.is-cyan {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .is-blue { color: var(--tera-light-accent-strong); }
  #terajs-devtools-root[data-theme="light"] .is-green { color: var(--tera-light-mint-ink); }
  #terajs-devtools-root[data-theme="light"] .is-purple { color: var(--tera-light-purple-ink); }
  #terajs-devtools-root[data-theme="light"] .is-red { color: var(--tera-light-red-ink); }
  #terajs-devtools-root[data-theme="light"] .is-cyan { color: var(--tera-light-cyan-ink); }
  #terajs-devtools-root[data-theme="light"] .is-amber { color: var(--tera-light-amber-ink); }

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
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-ai-tag {
    border-color: var(--tera-light-border);
    background: rgba(47, 109, 255, 0.08);
    color: var(--tera-light-text-soft);
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

  #terajs-devtools-root[data-theme="light"] .iframe-results-item {
    border-color: var(--tera-light-border);
    background: rgba(255, 255, 255, 0.72);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item.is-error {
    border-color: rgba(206, 76, 119, 0.24);
    background: linear-gradient(180deg, rgba(255, 224, 232, 0.88), rgba(255, 255, 255, 0.94));
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item.is-warn {
    border-color: rgba(219, 157, 50, 0.24);
    background: linear-gradient(180deg, rgba(255, 244, 216, 0.92), rgba(255, 255, 255, 0.94));
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item-title,
  #terajs-devtools-root[data-theme="light"] .timeline-control-count {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item-meta,
  #terajs-devtools-root[data-theme="light"] .iframe-results-item-summary,
  #terajs-devtools-root[data-theme="light"] .timeline-control-note {
    color: var(--tera-light-text-muted);
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

  #terajs-devtools-root::-webkit-scrollbar,
  .devtools-panel::-webkit-scrollbar,
  .devtools-tabs::-webkit-scrollbar,
  .components-screen-body::-webkit-scrollbar,
  .stack-list::-webkit-scrollbar,
  .signals-list::-webkit-scrollbar,
  .ai-prompt::-webkit-scrollbar,
  .ai-response::-webkit-scrollbar,
  .inspector-code::-webkit-scrollbar,
  .runtime-history-scroll::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  #terajs-devtools-root::-webkit-scrollbar-track,
  .devtools-panel::-webkit-scrollbar-track,
  .devtools-tabs::-webkit-scrollbar-track,
  .components-screen-body::-webkit-scrollbar-track,
  .stack-list::-webkit-scrollbar-track,
  .signals-list::-webkit-scrollbar-track,
  .ai-prompt::-webkit-scrollbar-track,
  .ai-response::-webkit-scrollbar-track,
  .inspector-code::-webkit-scrollbar-track,
  .runtime-history-scroll::-webkit-scrollbar-track {
    background: rgba(9, 20, 39, 0.46);
    border-radius: 999px;
  }

  #terajs-devtools-root::-webkit-scrollbar-thumb,
  .devtools-panel::-webkit-scrollbar-thumb,
  .devtools-tabs::-webkit-scrollbar-thumb,
  .components-screen-body::-webkit-scrollbar-thumb,
  .stack-list::-webkit-scrollbar-thumb,
  .signals-list::-webkit-scrollbar-thumb,
  .ai-prompt::-webkit-scrollbar-thumb,
  .ai-response::-webkit-scrollbar-thumb,
  .inspector-code::-webkit-scrollbar-thumb,
  .runtime-history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(55, 139, 255, 0.88), rgba(50, 215, 255, 0.76));
    border-radius: 999px;
    border: 2px solid rgba(9, 20, 39, 0.46);
  }

  #terajs-devtools-root[data-theme="light"]::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .components-screen-body::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .signals-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .inspector-code::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll::-webkit-scrollbar-track {
    background: rgba(206, 220, 243, 0.88);
  }

  #terajs-devtools-root[data-theme="light"]::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .components-screen-body::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .signals-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .inspector-code::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(64, 126, 213, 0.9), rgba(39, 174, 217, 0.86));
    border-color: rgba(206, 220, 243, 0.88);
  }
`;

