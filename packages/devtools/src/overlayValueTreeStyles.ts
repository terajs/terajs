export const overlayValueTreeStyles = `

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
    gap: 8px;
    padding: 4px 0;
    font: inherit;
    font-size: 12px;
    color: var(--tera-mist);
    min-width: 0;
    max-width: 100%;
  }

  .value-node-toggle {
    appearance: none;
    border: 0;
    border-radius: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .value-node-toggle:hover {
    background: var(--structured-value-row-hover, rgba(19, 32, 54, 0.62));
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
    padding: 2px 0 0 18px;
    min-width: 0;
    max-width: 100%;
  }

  .value-preview {
    grid-column: 3;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    overflow-wrap: anywhere;
  }

  .value-leaf--block {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: 8px;
    padding-top: 6px;
  }

  .value-leaf-heading {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .value-leaf--block .value-type {
    justify-self: auto;
  }

  .value-leaf--block .value-preview {
    grid-column: 1;
    min-width: 0;
  }

  .value-preview-block {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--structured-value-border, rgba(145, 173, 214, 0.14));
    border-left: 2px solid var(--structured-value-accent, rgba(76, 123, 255, 0.36));
    border-radius: 0;
    background: var(--structured-value-block-surface, rgba(4, 9, 19, 0.66));
    color: inherit;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    line-height: 1.58;
    max-height: min(320px, 36vh);
    overflow: auto;
  }

  .value-empty {
    padding: 2px 0;
    background: transparent;
    border: 0;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
  }

  .value-empty--block {
    display: grid;
    gap: 8px;
    padding-top: 8px;
  }

  .value-empty-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
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
`;