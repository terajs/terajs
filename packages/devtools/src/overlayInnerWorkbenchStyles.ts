export const overlayInnerWorkbenchStyles = `
  .devtools-workbench,
  .devtools-utility-panel {
    width: 100%;
    height: 100%;
    min-height: 0;
    margin: 0;
    flex: 1 1 auto;
    background: var(--tera-surface-page);
  }

  .devtools-workbench {
    display: grid;
    grid-template-columns: clamp(260px, 27vw, 340px) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    min-height: 0;
    height: 100%;
    gap: 0;
    overflow: hidden;
    align-items: stretch;
  }

  .devtools-utility-panel {
    overflow: hidden;
  }

  .devtools-workbench-sidebar,
  .devtools-workbench-main,
  .devtools-utility-panel {
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .devtools-workbench-sidebar {
    border: 1px solid var(--tera-separator-strong);
    border-radius: 0;
    background: var(--tera-surface-pane);
    box-shadow: none;
  }

  .devtools-workbench-main,
  .devtools-utility-panel {
    background: var(--tera-surface-pane-muted);
  }

  .devtools-workbench-main {
    border: 1px solid var(--tera-separator-strong);
    border-radius: 0;
    background: var(--tera-surface-pane-muted);
    box-shadow: none;
  }

  .devtools-workbench-header,
  .devtools-utility-panel-header {
    display: grid;
    gap: 8px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--tera-separator-strong);
    background: var(--tera-surface-pane-strong);
  }

  .devtools-workbench-main-header,
  .devtools-utility-panel-header {
    background: var(--tera-surface-pane-strong);
  }

  .devtools-workbench-title {
    color: var(--tera-title-ink);
    font-family: var(--tera-heading-font);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .devtools-workbench-subtitle {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.55;
  }

  .devtools-workbench-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .workbench-search {
    flex: 1 1 240px;
    min-width: 0;
  }

  .workbench-search-input {
    width: 100%;
    height: 36px;
    padding: 0 11px;
    border: 1px solid var(--tera-separator-strong);
    border-radius: 10px;
    background: var(--tera-surface-raised);
    color: var(--tera-cloud);
    font-size: 12px;
    line-height: 1.4;
    outline: none;
    transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
  }

  .workbench-search-input::placeholder {
    color: rgba(147, 167, 203, 0.58);
  }

  .workbench-search-input:focus {
    border-color: var(--tera-tone-accent);
    background: var(--tera-surface-pane-strong);
    box-shadow: none;
  }

  .devtools-workbench-sidebar-body,
  .devtools-workbench-main-body,
  .devtools-utility-panel-body {
    flex: 1;
    min-height: 0;
    height: 100%;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: 12px;
  }

  .devtools-workbench-sidebar-body,
  .devtools-workbench-main-body {
    overflow: auto;
    padding: 14px;
  }

  .devtools-utility-panel-body {
    overflow: auto;
  }

  .devtools-workbench-list {
    display: grid;
    gap: 4px;
    align-content: flex-start;
  }

  .devtools-workbench-list-group {
    padding: 8px 4px 2px;
    color: var(--tera-tone-label);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .devtools-workbench-list-item {
    appearance: none;
    width: 100%;
    display: grid;
    gap: 6px;
    padding: 11px 12px;
    border: 1px solid rgba(48, 72, 108, 0.82);
    border-left: 2px solid rgba(109, 158, 232, 0.4);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(11, 22, 39, 0.96), rgba(14, 25, 44, 0.92));
    color: var(--tera-cloud);
    text-align: left;
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  }

  .devtools-workbench-list-item:hover {
    background: linear-gradient(180deg, rgba(18, 33, 56, 0.98), rgba(15, 29, 49, 0.94));
    border-color: rgba(103, 181, 255, 0.34);
  }

  .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, rgba(20, 45, 74, 0.98), rgba(17, 34, 58, 0.96));
    border-color: rgba(103, 215, 255, 0.58);
    border-left-color: rgba(103, 215, 255, 0.96);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(53, 198, 255, 0.08);
  }

  .devtools-workbench-list-item.is-error {
    border-color: rgba(255, 107, 139, 0.28);
    border-left-color: var(--tera-tone-error);
    background: linear-gradient(180deg, rgba(34, 18, 28, 0.96), rgba(18, 16, 28, 0.9));
  }

  .devtools-workbench-list-item.is-warn {
    border-color: rgba(232, 136, 62, 0.32);
    border-left-color: var(--tera-tone-warn);
    background: linear-gradient(180deg, rgba(36, 24, 14, 0.96), rgba(19, 16, 22, 0.92));
  }

  .devtools-workbench-list-item-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .devtools-workbench-list-item-title {
    min-width: 0;
    color: var(--tera-cloud);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
  }

  .devtools-workbench-list-item-badge {
    margin-left: auto;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(39, 63, 102, 0.84);
    color: rgba(236, 245, 255, 0.92);
    font-family: var(--tera-code-font);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .devtools-workbench-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 18px;
  }

  .devtools-workbench-fact {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .devtools-workbench-fact-label {
    color: var(--tera-tone-label);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .devtools-workbench-fact-value {
    color: var(--tera-cloud);
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .devtools-workbench-lead {
    color: rgba(231, 240, 255, 0.92);
    font-size: 13px;
    line-height: 1.65;
  }

  .devtools-workbench-intro {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid #263753;
    border-radius: 18px;
    background: #0b1627;
  }

  .devtools-workbench-intro-copy {
    display: grid;
    gap: 6px;
  }

  .devtools-workbench-intro-title {
    color: var(--tera-title-ink);
    font-family: var(--tera-heading-font);
    font-size: 16px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  .devtools-workbench-intro-description {
    color: rgba(227, 238, 255, 0.82);
    font-size: 13px;
    line-height: 1.7;
    max-width: 72ch;
  }

  .devtools-workbench-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .devtools-workbench-metric {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid rgba(52, 79, 118, 0.78);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(16, 26, 45, 0.94), rgba(12, 21, 35, 0.9));
  }

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

  .signals-layout .devtools-workbench-list-item {
    position: relative;
    gap: 8px;
    padding: 12px 34px 12px 13px;
    border-color: #233752;
    border-radius: 14px;
    background: #0b1627;
  }

  .signals-layout .devtools-workbench-list-item::after {
    content: "›";
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(150, 179, 232, 0.54);
    font-size: 17px;
    line-height: 1;
  }

  .signals-layout .devtools-workbench-list-item:hover {
    background: #152238;
    border-color: #4e85ff;
  }

  .signals-layout .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, #223657, #152238);
    border-color: #4e85ff;
    box-shadow: none;
  }

  .signals-layout .devtools-workbench-list-item.is-active::after {
    color: rgba(223, 239, 255, 0.84);
  }

  .signals-layout .signals-detail-value {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
    height: 100%;
  }

  .signals-layout .signals-detail-stage {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .signals-layout .signals-detail-stage .structured-value-viewer,
  .signals-layout .signals-detail-stage .inspector-code {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
  }

  .signals-selection-note {
    padding: 10px 12px;
    border: 1px solid #4e85ff;
    border-radius: 12px;
    background: #12213a;
    color: rgba(213, 228, 255, 0.82);
    font-size: 12px;
    line-height: 1.55;
  }

  .devtools-utility-panel.investigation-journal {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
    background: var(--tera-surface-page);
  }

  .devtools-utility-panel.investigation-journal--issues {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
  }

  .devtools-utility-panel.investigation-journal--queue {
    --investigation-accent: var(--tera-tone-accent-soft);
    --investigation-accent-strong: var(--tera-tone-accent);
  }

  .devtools-utility-panel.investigation-journal .devtools-utility-panel-header {
    background: linear-gradient(180deg, #0e192b, #0b1524);
    border-bottom-color: var(--investigation-accent);
  }

  .devtools-utility-panel.investigation-journal .devtools-utility-panel-body {
    padding: 0 16px 20px;
    background: #091423;
    overflow: hidden;
  }

  .investigation-journal-shell {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 12px;
    align-content: start;
    min-width: 0;
    min-height: 0;
    height: 100%;
  }

  .investigation-journal-hero {
    display: grid;
    gap: 8px;
    padding: 12px 0 10px;
    background: #091423;
  }

  .investigation-journal-kicker {
    color: rgba(147, 167, 203, 0.76);
    font-family: var(--tera-code-font);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .investigation-journal-hero-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .investigation-journal-toolbar {
    display: grid;
    gap: 8px;
  }

  .investigation-journal-toolbar .workbench-search-input {
    height: 42px;
    border-radius: 14px;
    background: #101a2c;
  }

  .investigation-journal-grid {
    display: grid;
    grid-template-columns: minmax(220px, 272px) minmax(0, 1fr);
    gap: 0;
    align-items: stretch;
    min-height: 0;
  }

  .investigation-journal-feed,
  .investigation-journal-detail {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 14px;
    padding: 18px;
    border: 1px solid #263753;
    border-radius: 0;
    background: #0d1626;
    box-shadow: none;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  .investigation-journal-detail {
    gap: 18px;
    min-height: 560px;
    padding: 22px 24px;
    background: #0a1526;
  }

  .investigation-journal-section-header {
    display: grid;
    gap: 4px;
    padding-top: 2px;
    padding-bottom: 2px;
    border-bottom: 1px solid #243752;
  }

  .investigation-journal-section-title {
    color: var(--tera-title-ink);
    font-family: var(--tera-heading-font);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .investigation-journal-section-subtitle {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.5;
  }

  .investigation-journal .devtools-workbench-list {
    gap: 8px;
  }

  .investigation-journal .devtools-workbench-list-group {
    padding: 0 4px;
    color: rgba(147, 167, 203, 0.84);
  }

  .investigation-journal .devtools-workbench-list-item {
    padding: 10px 12px 10px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
  }

  .investigation-journal .devtools-workbench-list-item-title {
    font-size: 13px;
  }

  .investigation-journal .devtools-workbench-lead {
    max-width: 64ch;
  }

  .investigation-journal .devtools-workbench-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 22px;
  }

  .investigation-journal .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  .investigation-journal .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: transparent;
    box-shadow: inset 3px 0 0 var(--investigation-accent-strong);
  }

  .investigation-journal .devtools-workbench-list-item-badge {
    background: transparent;
    color: rgba(147, 167, 203, 0.78);
  }

  .investigation-journal .iframe-panel-stack {
    gap: 14px;
  }

  .investigation-journal .iframe-panel-section-block {
    gap: 10px;
    padding: 0 0 14px;
    border: 0;
    border-bottom: 1px solid #243752;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .investigation-journal .iframe-panel-section-block:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .investigation-journal .iframe-panel-section-heading {
    color: var(--tera-cloud);
  }

  .investigation-journal .workbench-filter-button.is-active,
  .investigation-journal .devtools-workbench-metric.is-accent {
    border-color: var(--investigation-accent-strong);
    background: var(--investigation-accent);
  }

  .devtools-utility-panel.diagnostics-deck {
    --diagnostics-accent: var(--tera-tone-accent-soft);
    --diagnostics-accent-strong: var(--tera-tone-accent);
    background: var(--tera-surface-page);
  }

  .devtools-utility-panel.diagnostics-deck--performance {
    --diagnostics-accent: var(--tera-tone-accent-soft);
    --diagnostics-accent-strong: var(--tera-tone-accent);
    background:
      radial-gradient(circle at top right, rgba(53, 198, 255, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(12, 22, 39, 0.96), rgba(8, 16, 29, 0.9));
  }

  .devtools-utility-panel.diagnostics-deck--sanity {
    --diagnostics-accent: var(--tera-tone-accent-soft);
    --diagnostics-accent-strong: var(--tera-tone-accent);
  }

  .devtools-utility-panel.diagnostics-deck .devtools-utility-panel-header {
    background: var(--tera-surface-pane-strong);
    border-bottom-color: var(--tera-separator);
  }

  .devtools-utility-panel.diagnostics-deck .devtools-utility-panel-body {
    background: var(--tera-surface-page);
  }

  .devtools-utility-panel.diagnostics-deck--performance .devtools-utility-panel-header {
    background: rgba(14, 26, 45, 0.84);
    border-bottom-color: rgba(145, 173, 214, 0.14);
  }

  .devtools-utility-panel.diagnostics-deck--performance .devtools-utility-panel-body {
    background: linear-gradient(180deg, rgba(13, 24, 43, 0.86), rgba(9, 18, 33, 0.78));
  }

  .devtools-utility-panel.diagnostics-deck--performance .diagnostics-note {
    background: rgba(14, 26, 45, 0.68);
  }

  .devtools-utility-panel.diagnostics-deck .iframe-panel-stack {
    gap: 16px;
  }

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
    background: linear-gradient(180deg, #fafcff, #f0f6ff);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-sidebar {
    border-color: #bfd2ee;
    background: #f8fbff;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-main,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel {
    background: #ffffff;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-main {
    border-color: #bfd2ee;
    background: #ffffff;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-header,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel-header {
    border-bottom-color: #d7e2f3;
    background: #ffffff;
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
    background: #eef4ff;
    border-color: #bfd2ee;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, rgba(235, 244, 255, 0.98), rgba(228, 239, 255, 0.96));
    border-color: #4f8dff;
    border-left-color: #2d8dd6;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item.is-warn {
    border-color: rgba(214, 115, 42, 0.28);
    border-left-color: rgba(214, 115, 42, 0.82);
    background: linear-gradient(180deg, rgba(255, 247, 239, 0.98), rgba(255, 251, 245, 0.96));
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item.is-error {
    border-color: rgba(178, 32, 79, 0.24);
    border-left-color: rgba(178, 32, 79, 0.82);
    background: linear-gradient(180deg, rgba(255, 243, 247, 0.98), rgba(255, 249, 251, 0.96));
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item-title,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-fact-value,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-lead {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item-badge {
    background: #e1ebff;
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro {
    border-color: #bfd2ee;
    background: #ffffff;
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
    border-color: #bfd2ee;
    background: #f7faff;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-warn {
    border-color: rgba(219, 157, 50, 0.24);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-error {
    border-color: rgba(206, 76, 119, 0.24);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-accent {
    border-color: rgba(15, 141, 119, 0.22);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-accent .devtools-workbench-metric-value {
    color: var(--tera-light-mint-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-warn .devtools-workbench-metric-value {
    color: var(--tera-light-amber-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric.is-error .devtools-workbench-metric-value {
    color: var(--tera-light-red-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-step::before {
    background: #e1ebff;
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-note {
    border-top-color: #d7e2f3;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure {
    border-color: #bfd2ee;
    background: #ffffff;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure-label {
    background: #e1ebff;
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure-toggle::after,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure-subtitle {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-disclosure-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-value-surface {
    border-color: #bfd2ee;
    background: #f7faff;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench .iframe-panel-section-block,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel .iframe-panel-section-block {
    border-bottom-color: #d7e2f3;
  }

  #terajs-devtools-root[data-theme="light"] .workbench-filter-button {
    border-color: #bfd2ee;
    background: #f7faff;
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-search-input {
    border-color: #bfd2ee;
    background: #f7faff;
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-search-input::placeholder {
    color: rgba(76, 101, 138, 0.58);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-search-input:focus {
    border-color: #6c98ff;
    background: #ffffff;
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .workbench-filter-button:hover {
    background: #eef4ff;
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .workbench-filter-button.is-active {
    background: var(--tera-surface-row-active);
    border-color: var(--tera-tone-accent-soft);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.signals-inspector-panel {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .signals-mode-row .workbench-filter-button {
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item {
    border-color: #bfd2ee;
    background: #f7faff;
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item:hover {
    background: #eef4ff;
    border-color: #6c98ff;
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, #e8f1ff, #dfeeff);
    border-color: #6c98ff;
    box-shadow: none;
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item::after {
    color: rgba(76, 101, 138, 0.48);
  }

  #terajs-devtools-root[data-theme="light"] .signals-layout .devtools-workbench-list-item.is-active::after {
    color: rgba(41, 82, 168, 0.88);
  }

  #terajs-devtools-root[data-theme="light"] .signals-selection-note {
    border-color: #6c98ff;
    background: #eef4ff;
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.investigation-journal {
    background: linear-gradient(180deg, #fafcff, #f0f6ff);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.investigation-journal .devtools-utility-panel-header {
    background: #ffffff;
    border-bottom-color: #bfd2ee;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.investigation-journal .devtools-utility-panel-body {
    background: #ffffff;
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-hero {
    background: #ffffff;
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-kicker,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-subtitle {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-hero-title,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-feed,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-detail {
    border-color: #bfd2ee;
    background: #ffffff;
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-header {
    border-bottom-color: #d7e2f3;
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .devtools-workbench-list-item {
    background: transparent;
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .devtools-workbench-list-item:hover {
    border-color: transparent;
    background: var(--tera-surface-row-hover);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .devtools-workbench-list-item-badge {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal .iframe-panel-section-block {
    border-bottom-color: #d7e2f3;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--performance {
    background:
      radial-gradient(circle at top right, rgba(47, 109, 255, 0.08), transparent 26%),
      linear-gradient(180deg, #f8fbff, #edf5ff);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck .devtools-utility-panel-header {
    background: var(--tera-surface-pane-strong);
    border-bottom-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--performance .devtools-utility-panel-header {
    background: rgba(244, 249, 255, 0.96);
    border-bottom-color: rgba(191, 210, 238, 0.86);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck .devtools-utility-panel-body {
    background: var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--performance .devtools-utility-panel-body {
    background: linear-gradient(180deg, #fdfefe, #f1f7ff);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-deck-hero {
    background: transparent;
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--performance .diagnostics-note {
    background: rgba(239, 247, 255, 0.96);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item {
    background: transparent;
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item-title,
  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item-badge {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item-summary,
  #terajs-devtools-root[data-theme="light"] .diagnostics-note {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item-meta {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-note {
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel {
    background:
      radial-gradient(circle at top right, rgba(73, 126, 255, 0.08), transparent 24%),
      var(--tera-surface-page);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-sidebar {
    background: var(--tera-surface-pane);
    border-right-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-main {
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-header {
    background: var(--tera-surface-pane-strong);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-list-item {
    background: var(--tera-surface-section);
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-list-item:hover {
    border-color: var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench.investigation-panel .devtools-workbench-list-item-badge {
    color: var(--tera-light-text-strong);
  }

  .devtools-workbench,
  .devtools-utility-panel,
  .devtools-workbench.investigation-panel,
  .devtools-utility-panel.diagnostics-deck {
    background: var(--tera-surface-page);
  }

  .devtools-workbench {
    gap: 0;
  }

  .devtools-workbench-sidebar,
  .devtools-workbench-main,
  .devtools-utility-panel {
    border: 1px solid var(--tera-separator-strong);
    border-radius: 0;
    box-shadow: none;
  }

  .devtools-workbench-sidebar {
    background: var(--tera-surface-pane);
    border-right-color: var(--tera-separator-strong);
  }

  .devtools-workbench-main,
  .devtools-utility-panel,
  .investigation-journal-detail {
    background: var(--tera-surface-pane-muted);
  }

  .devtools-utility-panel.diagnostics-deck--router,
  .devtools-utility-panel.diagnostics-deck--sanity {
    background: var(--tera-surface-pane-muted);
  }

  .devtools-workbench-header,
  .devtools-utility-panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px 12px;
    background: var(--tera-surface-pane-strong);
    border-bottom: 1px solid var(--tera-separator-strong);
  }

  .devtools-workbench-title {
    font-size: 14px;
  }

  .devtools-workbench-subtitle {
    font-size: 11px;
    letter-spacing: 0.01em;
    text-transform: none;
  }

  .devtools-workbench-title.is-blue,
  .devtools-workbench-title.is-cyan,
  .devtools-workbench-title.is-purple,
  .devtools-workbench-title.is-green,
  .devtools-workbench-title.is-amber,
  .devtools-workbench-title.is-red,
  .devtools-workbench-intro-title.is-blue,
  .devtools-workbench-intro-title.is-cyan,
  .devtools-workbench-intro-title.is-purple,
  .devtools-workbench-intro-title.is-green,
  .devtools-workbench-intro-title.is-amber,
  .devtools-workbench-intro-title.is-red,
  .investigation-journal-section-title.is-blue,
  .investigation-journal-section-title.is-cyan,
  .investigation-journal-section-title.is-purple,
  .investigation-journal-section-title.is-green,
  .investigation-journal-section-title.is-amber,
  .investigation-journal-section-title.is-red,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-blue,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-cyan,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-purple,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-green,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-amber,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-title.is-red,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-blue,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-cyan,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-purple,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-green,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-amber,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-intro-title.is-red,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-blue,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-cyan,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-purple,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-green,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-amber,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title.is-red {
    color: var(--tera-title-ink);
  }

  .devtools-utility-panel-header-main {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .devtools-utility-panel-toolbar {
    display: grid;
    gap: 6px;
    flex: 1 1 340px;
    justify-items: end;
    min-width: 0;
  }

  .devtools-utility-panel-toolbar > * {
    width: min(100%, 560px);
  }

  .devtools-workbench-toolbar {
    gap: 8px;
  }

  .workbench-search-input {
    height: 36px;
    border-radius: 12px;
    background: var(--tera-surface-raised);
  }

  .devtools-workbench-sidebar-body,
  .devtools-workbench-main-body,
  .devtools-utility-panel-body {
    padding: 12px;
  }

  .devtools-utility-panel.diagnostics-deck--router .devtools-utility-panel-body,
  .devtools-utility-panel.diagnostics-deck--sanity .devtools-utility-panel-body {
    background: transparent;
  }

  .devtools-workbench-sidebar-body,
  .devtools-workbench-main-body,
  .investigation-journal-feed,
  .investigation-journal-detail,
  .devtools-utility-panel-body {
    scrollbar-width: thin;
  }

  .devtools-workbench-list {
    gap: 0;
  }

  .devtools-workbench-list-group {
    padding: 10px 0 4px;
  }

  .devtools-workbench-list-item {
    position: relative;
    gap: 6px;
    min-height: 40px;
    padding: 9px 10px 9px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
  }

  .devtools-workbench-list-item::before {
    content: "";
    position: absolute;
    left: 4px;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 999px;
    background: var(--tera-separator-strong);
    opacity: 0;
    transition: opacity 140ms ease, background 140ms ease;
  }

  .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  .devtools-workbench-list-item:hover::before {
    background: var(--tera-tone-accent-soft);
    opacity: 1;
  }

  .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  .devtools-workbench-list-item.is-active::before {
    background: var(--tera-tone-accent);
    opacity: 1;
  }

  .ai-panel-screen .devtools-workbench-list-item:hover {
    background: rgba(79, 166, 255, 0.12);
  }

  .ai-panel-screen .devtools-workbench-list-item:hover::before {
    background: rgba(127, 214, 255, 0.78);
  }

  .ai-panel-screen .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, rgba(74, 143, 240, 0.28), rgba(19, 39, 72, 0.5));
    box-shadow: inset 3px 0 0 #7fd6ff;
  }

  .ai-panel-screen .devtools-workbench-list-item.is-active::before {
    background: #7fd6ff;
  }

  .devtools-workbench-list-item.is-warn {
    border-color: transparent;
  }

  .devtools-workbench-list-item.is-warn::before {
    background: var(--tera-tone-warn);
    opacity: 0.82;
  }

  .devtools-workbench-list-item.is-error {
    border-color: transparent;
  }

  .devtools-workbench-list-item.is-error::before {
    background: var(--tera-tone-error);
    opacity: 0.82;
  }

  .devtools-workbench-list-item-badge {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: rgba(147, 167, 203, 0.72);
    font-weight: 700;
  }

  .devtools-workbench-list-item.is-warn .devtools-workbench-list-item-badge {
    color: var(--tera-tone-warn);
  }

  .devtools-workbench-list-item.is-error .devtools-workbench-list-item-badge {
    color: var(--tera-tone-error);
  }

  .devtools-workbench-intro {
    gap: 10px;
    padding: 2px 0 2px 16px;
    border: 0;
    border-left: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-accent-soft);
  }

  .devtools-workbench-note {
    padding-top: 10px;
    border-top: 1px solid var(--tera-separator);
  }

  .devtools-workbench-metrics {
    gap: 8px;
  }

  .devtools-workbench-metric {
    min-height: 0;
    padding: 8px 0 8px 16px;
    border: 0;
    border-left: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: inset 3px 0 0 var(--tera-separator-strong);
  }

  .devtools-workbench-metric.is-warn {
    box-shadow: inset 3px 0 0 var(--tera-tone-warn);
  }

  .devtools-workbench-metric.is-error {
    box-shadow: inset 3px 0 0 var(--tera-tone-error);
  }

  .devtools-workbench-metric.is-accent {
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  .devtools-value-surface {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .devtools-value-surface .structured-value-viewer {
    border-top: 0;
  }

  .devtools-value-surface .inspector-code {
    border-top: 1px solid var(--tera-separator);
  }

  .investigation-journal-shell {
    gap: 12px;
    height: 100%;
  }

  .investigation-journal-grid {
    grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
    gap: 12px;
    min-height: 0;
    height: 100%;
  }

  .investigation-journal-feed,
  .investigation-journal-detail {
    gap: 12px;
    padding: 14px 16px 16px;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .investigation-journal-feed {
    background: transparent;
  }

  .investigation-journal-detail {
    min-height: 0;
    padding: 14px 18px 18px;
  }

  .investigation-journal-section-header {
    display: grid;
    align-content: center;
    gap: 6px;
    min-height: 56px;
    padding: 4px 0 14px;
    border-bottom: 1px solid var(--tera-separator);
  }

  .investigation-journal--logs .investigation-journal-section-title,
  .investigation-journal--timeline .investigation-journal-section-title,
  .investigation-journal--queue .investigation-journal-section-title {
    color: var(--tera-title-ink);
  }

  .investigation-journal--logs .investigation-journal-section-subtitle,
  .investigation-journal--timeline .investigation-journal-section-subtitle,
  .investigation-journal--queue .investigation-journal-section-subtitle {
    color: var(--tera-tone-label);
  }

  .investigation-journal--issues .investigation-journal-section-title {
    color: var(--tera-amber);
  }

  .investigation-journal--issues .investigation-journal-section-subtitle,
  .investigation-journal--issues .devtools-workbench-list-group {
    color: var(--tera-tone-warn);
  }

  .investigation-journal .devtools-workbench-list-item,
  .investigation-journal .devtools-workbench-list-item:hover,
  .investigation-journal .devtools-workbench-list-item.is-active {
    border-radius: 6px;
    box-shadow: none;
  }

  .devtools-utility-panel.diagnostics-deck .iframe-panel-stack {
    gap: 12px;
  }

  .devtools-utility-panel.diagnostics-deck .iframe-panel-section-heading {
    color: var(--tera-title-ink);
  }

  .diagnostics-deck-hero {
    gap: 10px;
    padding: 0 0 12px;
    border: 0;
    border-bottom: 1px solid var(--tera-separator);
    border-radius: 0;
    background: transparent;
  }

  .diagnostics-feed {
    gap: 6px;
  }

  .diagnostics-feed-item {
    gap: 6px;
    padding: 10px 10px 10px 16px;
    border: 1px solid transparent;
    border-bottom: 0;
    border-radius: 6px;
    background: transparent;
  }

  .diagnostics-feed-item::before {
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

  .diagnostics-feed-item-badge {
    padding: 0;
    border-radius: 0;
    background: transparent;
  }

  .diagnostics-note {
    padding: 0 0 0 12px;
    border: 0;
    border-left: 2px solid var(--tera-tone-accent-soft);
    border-radius: 0;
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-sidebar {
    background: var(--tera-surface-pane);
    border-right-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-header,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel-header,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-header,
  #terajs-devtools-root[data-theme="light"] .diagnostics-deck-hero,
  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item,
  #terajs-devtools-root[data-theme="light"] .diagnostics-feed-item,
  #terajs-devtools-root[data-theme="light"] .investigation-journal-feed {
    border-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item:hover {
    background: var(--tera-surface-row-hover);
    border-color: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-title {
    color: var(--tera-title-ink);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal-section-subtitle {
    color: var(--tera-tone-label);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal--issues .investigation-journal-section-title {
    color: var(--tera-light-amber-ink);
  }

  #terajs-devtools-root[data-theme="light"] .investigation-journal--issues .investigation-journal-section-subtitle,
  #terajs-devtools-root[data-theme="light"] .investigation-journal--issues .devtools-workbench-list-group {
    color: var(--tera-light-amber-ink);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-list-item.is-active {
    background: var(--tera-surface-row-active);
    border-color: transparent;
    box-shadow: inset 3px 0 0 var(--tera-tone-accent);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .devtools-workbench-list-item:hover {
    background: rgba(83, 166, 255, 0.12);
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, rgba(152, 209, 255, 0.2), rgba(227, 240, 255, 0.88));
    box-shadow: inset 3px 0 0 #53a6ff;
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel-screen .devtools-workbench-list-item.is-active::before {
    background: #53a6ff;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-workbench-metric {
    background: var(--tera-surface-section);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--router,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--sanity {
    background: var(--tera-surface-pane-muted);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--router .devtools-utility-panel-body,
  #terajs-devtools-root[data-theme="light"] .devtools-utility-panel.diagnostics-deck--sanity .devtools-utility-panel-body {
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-value-surface .structured-value-viewer,
  #terajs-devtools-root[data-theme="light"] .devtools-value-surface .inspector-code {
    border-top-color: var(--tera-separator);
  }

  #terajs-devtools-root[data-theme="light"] .diagnostics-note {
    background: var(--tera-surface-section);
  }

  @media (max-width: 900px) {
    .devtools-workbench {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(220px, 34vh) minmax(0, 1fr);
    }

    .investigation-journal-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .devtools-workbench-sidebar {
      border-bottom-color: rgba(145, 173, 214, 0.12);
    }

    #terajs-devtools-root[data-theme="light"] .devtools-workbench-sidebar {
      border-bottom-color: var(--tera-separator);
    }

    .devtools-workbench-facts {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;