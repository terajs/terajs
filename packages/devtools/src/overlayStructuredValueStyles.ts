export const overlayStructuredValueStyles = `

  .structured-value-viewer {
    --structured-value-border: rgba(145, 173, 214, 0.14);
    --structured-value-accent: rgba(76, 123, 255, 0.36);
    --structured-value-row-border: rgba(145, 173, 214, 0.08);
    --structured-value-row-hover: rgba(19, 32, 54, 0.62);
    --structured-value-surface: rgba(9, 17, 31, 0.78);
    --structured-value-block-surface: rgba(4, 9, 19, 0.66);
    padding: 0;
    max-height: min(420px, 52vh);
    border: 1px solid var(--structured-value-border);
    border-left: 2px solid var(--structured-value-accent);
    border-radius: 0;
    white-space: normal;
    overflow-x: auto;
    overflow-y: auto;
    overflow-wrap: normal;
    word-break: normal;
    background: var(--structured-value-surface);
  }

  .structured-value-tree {
    padding: 12px;
  }

  .structured-value-lines {
    display: grid;
    min-width: min-content;
  }

  .structured-value-line {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    padding: 0 14px;
    min-width: min-content;
    border-bottom: 1px solid var(--structured-value-row-border);
  }

  .structured-value-line:last-child {
    border-bottom: 0;
  }

  .structured-value-line::before {
    content: attr(data-line-number);
    display: block;
    padding: 9px 0;
    color: rgba(147, 167, 203, 0.52);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.7;
    text-align: right;
    user-select: none;
  }

  .structured-value-code {
    display: block;
    min-width: min-content;
    padding: 9px 0;
    white-space: pre;
    color: #dff5ff;
  }

  .json-indent {
    color: transparent;
    user-select: none;
  }

  .json-key {
    color: #89d7ff;
  }

  .json-string {
    color: #ffd58b;
  }

  .json-number {
    color: #9bf0c4;
  }

  .json-boolean {
    color: #ff8cb1;
  }

  .json-null,
  .json-punctuation {
    color: #9faed3;
  }

  .json-raw {
    color: #d9e7ff;
  }

  .structured-value-grid {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }

  .structured-value-section {
    display: grid;
    gap: 6px;
    padding: 0 0 0 12px;
    border: 0;
    border-left: 2px solid var(--structured-value-accent, rgba(76, 123, 255, 0.26));
    border-radius: 0;
    background: transparent;
  }

  .structured-value-section-title {
    color: var(--tera-mist);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .route-snapshot-layout {
    display: grid;
    gap: 12px;
  }

  .route-snapshot-grid {
    gap: 8px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-code {
    background: var(--tera-light-panel-raised-soft);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
  }

  #terajs-devtools-root[data-theme="light"] .structured-value-viewer {
    --structured-value-border: rgba(112, 148, 214, 0.18);
    --structured-value-accent: rgba(73, 126, 255, 0.42);
    --structured-value-row-border: rgba(112, 148, 214, 0.12);
    --structured-value-row-hover: rgba(73, 126, 255, 0.08);
    --structured-value-surface: rgba(248, 251, 255, 0.94);
    --structured-value-block-surface: rgba(255, 255, 255, 0.92);
    background: var(--structured-value-surface);
  }

  #terajs-devtools-root[data-theme="light"] .structured-value-line {
    border-bottom-color: rgba(47, 109, 255, 0.08);
  }

  #terajs-devtools-root[data-theme="light"] .structured-value-line::before {
    color: rgba(116, 111, 232, 0.62);
  }

  #terajs-devtools-root[data-theme="light"] .structured-value-code {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .json-key {
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .json-string {
    color: #975a00;
  }

  #terajs-devtools-root[data-theme="light"] .json-number {
    color: var(--tera-light-mint-ink);
  }

  #terajs-devtools-root[data-theme="light"] .json-boolean {
    color: var(--tera-light-red-ink);
  }

  #terajs-devtools-root[data-theme="light"] .json-null,
  #terajs-devtools-root[data-theme="light"] .json-punctuation,
  #terajs-devtools-root[data-theme="light"] .json-raw,
  #terajs-devtools-root[data-theme="light"] .structured-value-section-title {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .structured-value-section {
    border-left-color: var(--structured-value-accent);
    background: transparent;
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
    background: var(--structured-value-row-hover);
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
  #terajs-devtools-root[data-theme="light"] .value-empty,
  #terajs-devtools-root[data-theme="light"] .value-empty-meta {
    color: var(--tera-light-text-muted);
  }


`;