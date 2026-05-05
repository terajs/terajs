import { escapeHtml, safeString, shortJson } from "./shared.js";

const BLOCK_STRING_PREVIEW_MIN_LENGTH = 160;

export function renderValueExplorer(
  value: unknown,
  rootPath: string,
  expandedValuePaths: Set<string>
): string {
  if (!isExpandableValue(value)) {
    return renderRootPrimitiveValue(normalizeInspectableValue(value, new WeakSet<object>()));
  }

  const seen = new WeakSet<object>();
  const normalizedValue = normalizeInspectableValue(value, seen);
  if (!isExpandableValue(normalizedValue)) {
    return renderRootPrimitiveValue(normalizedValue);
  }

  return `
    <div class="inspector-code inspector-json structured-value-viewer">
      <div class="value-explorer structured-value-tree">
        ${renderRootValueTree(normalizedValue, rootPath, expandedValuePaths, seen)}
      </div>
    </div>
  `;
}

export function isExpandableValue(value: unknown): value is Record<string, unknown> | unknown[] {
  return Array.isArray(value) || (!!value && typeof value === "object");
}

export function formatPrimitiveValue(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return String(value);
  }

  return shortJson(value);
}

function renderRootValueTree(
  value: Record<string, unknown> | unknown[],
  rootPath: string,
  expandedValuePaths: Set<string>,
  seen: WeakSet<object>
): string {
  const entries = getValueEntries(value);

  if (entries.length === 0) {
    return `<div class="value-empty">${escapeHtml(summarizeCompositeValue(value))}</div>`;
  }

  return entries.map((entry) => renderValueTreeEntry(entry.label, entry.value, appendValuePath(rootPath, entry.pathSegment), expandedValuePaths, seen)).join("");
}

function renderValueTreeEntry(
  label: string,
  value: unknown,
  valuePath: string,
  expandedValuePaths: Set<string>,
  seen: WeakSet<object>
): string {
  const normalizedValue = normalizeInspectableValue(value, seen);
  if (!isExpandableValue(normalizedValue)) {
    return renderValueLeaf(label, normalizedValue);
  }

  const entries = getValueEntries(normalizedValue);
  if (entries.length === 0) {
    return renderValueLeaf(label, summarizeCompositeValue(normalizedValue));
  }

  const expanded = expandedValuePaths.has(valuePath);
  return `
    <div class="value-node">
      <button
        type="button"
        class="value-node-toggle"
        data-action="toggle-value-node"
        data-value-path="${escapeHtml(valuePath)}"
        aria-expanded="${expanded ? "true" : "false"}"
      >
        <span class="value-node-chevron">${expanded ? "▾" : "▸"}</span>
        <span class="value-key">${renderPropertyLabel(label)}</span>
        <span class="value-type">${escapeHtml(summarizeCompositeValue(normalizedValue))}</span>
      </button>
      ${expanded
        ? `<div class="value-node-children">${entries.map((entry) => renderValueTreeEntry(entry.label, entry.value, appendValuePath(valuePath, entry.pathSegment), expandedValuePaths, seen)).join("")}</div>`
        : ""}
    </div>
  `;
}

function renderValueLeaf(label: string, value: unknown): string {
  if (typeof value === "string" && shouldRenderStringAsBlock(value)) {
    return `
      <div class="value-leaf value-leaf--block">
        <div class="value-leaf-heading">
          <span class="value-key">${renderPropertyLabel(label)}</span>
          <span class="value-separator">:</span>
          <span class="value-type">${escapeHtml(`String ${summarizeStringValue(value)}`)}</span>
        </div>
        ${renderBlockStringPreviewMarkup(value)}
      </div>
    `;
  }

  return `
    <div class="value-leaf">
      <span class="value-key">${renderPropertyLabel(label)}</span>
      <span class="value-separator">:</span>
      <span class="value-preview">${renderPrimitivePreviewMarkup(value)}</span>
    </div>
  `;
}

function getValueEntries(value: Record<string, unknown> | unknown[]) {
  if (Array.isArray(value)) {
    return value.map((entry, index) => ({
      label: `[${index}]`,
      pathSegment: String(index),
      value: entry,
    }));
  }

  return Object.entries(value).map(([key, entry]) => ({
    label: key,
    pathSegment: key,
    value: entry,
  }));
}

function appendValuePath(parentPath: string, segment: string): string {
  return `${parentPath}/${encodeURIComponent(segment)}`;
}

function summarizeCompositeValue(value: Record<string, unknown> | unknown[]): string {
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }

  return `Object(${Object.keys(value).length})`;
}

function renderPropertyLabel(label: string): string {
  return label.startsWith("[") ? escapeHtml(label) : renderToken("json-key", JSON.stringify(label));
}

function renderRootPrimitiveValue(value: unknown): string {
  if (typeof value === "string" && shouldRenderStringAsBlock(value)) {
    return `
      <div class="value-empty value-empty--block">
        <div class="value-empty-meta">${escapeHtml(`String ${summarizeStringValue(value)}`)}</div>
        ${renderBlockStringPreviewMarkup(value)}
      </div>
    `;
  }

  return `<div class="value-empty">${renderPrimitivePreviewMarkup(value)}</div>`;
}

function renderPrimitivePreviewMarkup(value: unknown): string {
  if (typeof value === "string") {
    const serialized = value.startsWith("[") && value.endsWith("]") && value !== "[undefined]"
      ? value
      : JSON.stringify(value);
    return renderToken("json-string", serialized);
  }

  if (typeof value === "number") {
    return renderToken("json-number", String(value));
  }

  if (typeof value === "boolean") {
    return renderToken("json-boolean", String(value));
  }

  if (value === null) {
    return renderToken("json-null", "null");
  }

  if (value === undefined) {
    return renderToken("json-raw", "undefined");
  }

  return renderToken("json-raw", formatPrimitiveValue(value));
}

function renderBlockStringPreviewMarkup(value: string): string {
  return `<pre class="value-preview value-preview-block"><span class="json-string">${escapeHtml(value)}</span></pre>`;
}

function shouldRenderStringAsBlock(value: string): boolean {
  return value.length >= BLOCK_STRING_PREVIEW_MIN_LENGTH || value.includes("\n") || value.includes("\r");
}

function summarizeStringValue(value: string): string {
  const lineCount = value.split(/\r\n|\r|\n/).length;
  return lineCount > 1 ? `${value.length} chars | ${lineCount} lines` : `${value.length} chars`;
}

function normalizeInspectableValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "function") {
    return `[Function ${(value as Function).name || "anonymous"}]`;
  }

  if (typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "bigint") {
    return `${value.toString()}n`;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message
    };
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? value.toString() : value.toISOString();
  }

  if (value && typeof value === "object") {
    if (seen.has(value as object)) {
      return "[Circular]";
    }
    seen.add(value as object);
  }

  return value;
}

function renderToken(className: string, value: string): string {
  return `<span class="${className}">${escapeHtml(value)}</span>`;
}
