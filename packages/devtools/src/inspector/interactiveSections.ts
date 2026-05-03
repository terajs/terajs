export type PrimitiveEditableValue = string | number | boolean;

export interface InspectorMountedComponent {
  scope: string;
  instance: number;
}

export interface InspectorReactiveFeedEntry {
  key: string;
  preview: string;
}

export interface LiveReactiveEntry {
  rid: string;
  label: string;
  type: string;
  currentValue: unknown;
}

export interface InspectorEventLike {
  type: string;
  payload?: Record<string, unknown>;
}

export interface InspectorInteractiveSectionDeps {
  resolveLivePropsSnapshot(scope: string, instance: number, fallback: unknown): unknown;
  renderInspectorRuntimeMonitor(events: InspectorEventLike[], scope: string, instance: number, query: string): string;
  matchesInspectorQuery(query: string, ...values: unknown[]): boolean;
  collectOwnedReactiveEntries(scope: string, instance: number): LiveReactiveEntry[];
  renderValueExplorer(value: unknown, rootPath: string, expandedValuePaths: Set<string>): string;
  escapeHtml(value: string): string;
  isExpandableValue(value: unknown): value is Record<string, unknown> | unknown[];
  formatPrimitiveValue(value: unknown): string;
  describeEditablePrimitive(value: unknown): { type: "string" | "number" | "boolean"; value: PrimitiveEditableValue } | null;
  describeInspectableValueType(value: unknown): string;
  unwrapInspectableValue(value: unknown): unknown;
}

export function renderInspectorPropsPanel(
  events: InspectorEventLike[],
  expandedValuePaths: Set<string>,
  selected: InspectorMountedComponent,
  propsSnapshot: unknown,
  query: string,
  deps: InspectorInteractiveSectionDeps
): string {
  const livePropsSnapshot = deps.resolveLivePropsSnapshot(selected.scope, selected.instance, propsSnapshot);
  const runtimeMonitorMarkup = deps.renderInspectorRuntimeMonitor(events, selected.scope, selected.instance, query);

  const renderScriptBody = (body: string): string => {
    if (runtimeMonitorMarkup.length === 0) {
      return body;
    }

    return `
      ${body}
      <div class="tiny-muted">computed, watch, and effect activity</div>
      ${runtimeMonitorMarkup}
    `;
  };

  if (!livePropsSnapshot || typeof livePropsSnapshot !== "object" || Array.isArray(livePropsSnapshot)) {
    return renderScriptBody(deps.renderValueExplorer(livePropsSnapshot ?? {}, "props", expandedValuePaths));
  }

  const entries = Object.entries(livePropsSnapshot as Record<string, unknown>);
  const partitionedEntries = partitionScriptEntries(entries);

  if (entries.length === 0) {
    if (runtimeMonitorMarkup.length > 0) {
      return renderScriptBody(`<div class="empty-state">This component does not currently expose any props.</div>`);
    }

    return `<div class="empty-state">This component does not currently expose any props.</div>`;
  }

  const visibleProps = filterScriptEntries(partitionedEntries.props, query, deps);
  const visibleRouteInputs = filterScriptEntries(partitionedEntries.routeInputs, query, deps);

  if (visibleProps.length === 0 && visibleRouteInputs.length === 0) {
    return runtimeMonitorMarkup;
  }

  const propsMarkup = [
    renderScriptEntryGroup({
      title: partitionedEntries.routeInputs.length > 0 ? "props" : null,
      entries: visibleProps,
      selected,
      expandedValuePaths,
      deps,
      originLabel: "prop",
      editable: true
    }),
    renderScriptEntryGroup({
      title: partitionedEntries.routeInputs.length > 0 ? "framework-injected route inputs" : null,
      entries: visibleRouteInputs,
      selected,
      expandedValuePaths,
      deps,
      originLabel: "framework route input",
      editable: false
    })
  ].filter((section) => section.length > 0).join("");

  return renderScriptBody(propsMarkup);
}

const ROUTE_INPUT_PROP_KEYS = new Set(["router", "route", "params", "query", "hash", "data"]);

function partitionScriptEntries(entries: Array<[string, unknown]>): {
  props: Array<[string, unknown]>;
  routeInputs: Array<[string, unknown]>;
} {
  const entryMap = new Map(entries);
  const routeInputKeys = Array.from(ROUTE_INPUT_PROP_KEYS).filter((key) => entryMap.has(key));
  const routeEnvelopeDetected = entryMap.has("route")
    && routeInputKeys.length >= 4
    && (entryMap.has("params") || entryMap.has("query") || entryMap.has("hash") || entryMap.has("data"));

  if (!routeEnvelopeDetected) {
    return {
      props: entries,
      routeInputs: []
    };
  }

  const props: Array<[string, unknown]> = [];
  const routeInputs: Array<[string, unknown]> = [];

  for (const entry of entries) {
    if (ROUTE_INPUT_PROP_KEYS.has(entry[0])) {
      routeInputs.push(entry);
      continue;
    }

    props.push(entry);
  }

  return { props, routeInputs };
}

function filterScriptEntries(
  entries: Array<[string, unknown]>,
  query: string,
  deps: InspectorInteractiveSectionDeps
): Array<[string, unknown]> {
  return query.length === 0
    ? entries
    : entries.filter(([key, value]) => deps.matchesInspectorQuery(query, key, value));
}

function renderScriptEntryGroup(options: {
  title: string | null;
  entries: Array<[string, unknown]>;
  selected: InspectorMountedComponent;
  expandedValuePaths: Set<string>;
  deps: InspectorInteractiveSectionDeps;
  originLabel: string;
  editable: boolean;
}): string {
  if (options.entries.length === 0) {
    return "";
  }

  return `
    ${options.title ? `<div class="tiny-muted">${options.deps.escapeHtml(options.title)}</div>` : ""}
    <div class="inspector-control-list">
      ${options.entries.map(([key, value]) => renderPropInspectorEntry({
        selected: options.selected,
        key,
        value,
        expandedValuePaths: options.expandedValuePaths,
        deps: options.deps,
        originLabel: options.originLabel,
        editable: options.editable
      })).join("")}
    </div>
  `;
}

export function renderInspectorReactivePanel(
  expandedValuePaths: Set<string>,
  selected: InspectorMountedComponent,
  reactiveFeed: InspectorReactiveFeedEntry[],
  query: string,
  deps: InspectorInteractiveSectionDeps
): string {
  const liveReactiveEntries = deps.collectOwnedReactiveEntries(selected.scope, selected.instance);

  const visibleLiveReactiveEntries = query.length === 0
    ? liveReactiveEntries
    : liveReactiveEntries.filter((entry) => deps.matchesInspectorQuery(query, entry.label, entry.type, entry.currentValue));

  const visibleReactiveFeed = query.length === 0
    ? reactiveFeed
    : reactiveFeed.filter((entry) => deps.matchesInspectorQuery(query, entry.key, entry.preview));

  if (visibleLiveReactiveEntries.length === 0 && visibleReactiveFeed.length === 0) {
    return "";
  }

  return `
    ${visibleLiveReactiveEntries.length === 0 ? "" : `
      <div class="muted-text">Registry-backed reactives can be toggled or edited inline.</div>
      <div class="inspector-control-list">
        ${visibleLiveReactiveEntries.map((entry) => renderReactiveInspectorEntry(entry, expandedValuePaths, deps)).join("")}
      </div>
    `}
    ${visibleReactiveFeed.length === 0 ? "" : `
      <div class="tiny-muted">Recent reactive activity</div>
      <ul class="stack-list reactive-feed">
        ${visibleReactiveFeed.map((entry) => `
          <li class="stack-item reactive-feed-item">
            <span class="accent-text is-cyan">${deps.escapeHtml(entry.key)}</span>
            <span class="muted-text">${deps.escapeHtml(entry.preview)}</span>
          </li>
        `).join("")}
      </ul>
    `}
  `;
}

function renderPropInspectorEntry(options: {
  selected: InspectorMountedComponent;
  key: string;
  value: unknown;
  expandedValuePaths: Set<string>;
  deps: InspectorInteractiveSectionDeps;
  originLabel: string;
  editable: boolean;
}): string {
  const resolvedValue = options.deps.unwrapInspectableValue(options.value);
  const editableValue = options.editable ? options.deps.describeEditablePrimitive(resolvedValue) : null;
  const typeLabel = options.deps.describeInspectableValueType(options.value);
  const editorMarkup = editableValue && editableValue.type === "boolean"
    ? `<div class="inspector-inline-edit-row">${renderPrimitiveEditorControl({
        kind: "prop",
        scope: options.selected.scope,
        instance: options.selected.instance,
        key: options.key,
        value: editableValue.value,
        valueType: editableValue.type
      }, options.deps)}</div>`
    : "";
  const valueMarkup = options.deps.isExpandableValue(resolvedValue)
    ? options.deps.renderValueExplorer(resolvedValue, `props.${options.key}`, options.expandedValuePaths)
    : editableValue && editableValue.type === "boolean"
      ? ""
      : `<div class="inspector-inline-value">${options.deps.escapeHtml(options.deps.formatPrimitiveValue(resolvedValue))}</div>`;

  return `
    <details class="inspector-dropdown">
      <summary class="inspector-dropdown-summary">
        <span class="inspector-dropdown-label">
          <span class="inspector-dropdown-origin">${options.deps.escapeHtml(options.originLabel)}</span>
          <span class="inspector-dropdown-key">${options.deps.escapeHtml(options.key)}</span>
          <span class="inspector-dropdown-type">: ${options.deps.escapeHtml(typeLabel)}</span>
        </span>
      </summary>
      <div class="inspector-dropdown-body">
        ${editorMarkup}
        ${valueMarkup}
      </div>
    </details>
  `;
}

function renderReactiveInspectorEntry(
  entry: LiveReactiveEntry,
  expandedValuePaths: Set<string>,
  deps: InspectorInteractiveSectionDeps
): string {
  const editable = deps.describeEditablePrimitive(entry.currentValue);
  const editorMarkup = editable && editable.type === "boolean"
    ? `<div class="inspector-inline-edit-row">${renderPrimitiveEditorControl({
        kind: "reactive",
        rid: entry.rid,
        value: editable.value,
        valueType: editable.type
      }, deps)}</div>`
    : "";
  const valueMarkup = deps.isExpandableValue(entry.currentValue)
    ? deps.renderValueExplorer(entry.currentValue, `reactive.${entry.rid}`, expandedValuePaths)
    : editable && editable.type === "boolean"
      ? ""
      : `<div class="inspector-inline-value">${deps.escapeHtml(deps.formatPrimitiveValue(entry.currentValue))}</div>`;

  return `
    <details class="inspector-dropdown">
      <summary class="inspector-dropdown-summary">
        <span class="inspector-dropdown-label">
          <span class="inspector-dropdown-origin">reactive</span>
          <span class="inspector-dropdown-key">${deps.escapeHtml(entry.label)}</span>
          <span class="inspector-dropdown-type">: ${deps.escapeHtml(entry.type)}</span>
        </span>
      </summary>
      <div class="inspector-dropdown-body">
        ${editorMarkup}
        ${valueMarkup}
      </div>
    </details>
  `;
}

function renderPrimitiveEditorControl(
  options: {
    kind: "prop" | "reactive";
    valueType: "string" | "number" | "boolean";
    value: PrimitiveEditableValue;
    scope?: string;
    instance?: number;
    key?: string;
    rid?: string;
  },
  deps: InspectorInteractiveSectionDeps
): string {
  if (options.valueType === "boolean") {
    if (options.kind === "prop") {
      return `
        <button
          class="toolbar-button inspector-toggle-button ${options.value ? "is-active" : ""}"
          data-action="toggle-live-prop"
          data-component-scope="${deps.escapeHtml(options.scope ?? "")}" 
          data-component-instance="${deps.escapeHtml(String(options.instance ?? ""))}"
          data-prop-key="${deps.escapeHtml(options.key ?? "")}"
          type="button"
        >${options.value ? "Enabled" : "Disabled"}</button>
      `;
    }

    return `
      <button
        class="toolbar-button inspector-toggle-button ${options.value ? "is-active" : ""}"
        data-action="toggle-live-reactive"
        data-reactive-rid="${deps.escapeHtml(options.rid ?? "")}"
        type="button"
      >${options.value ? "Enabled" : "Disabled"}</button>
    `;
  }

  const inputType = options.valueType === "number" ? "number" : "text";
  const dataAttributes = options.kind === "prop"
    ? `data-live-prop-input="true" data-component-scope="${deps.escapeHtml(options.scope ?? "")}" data-component-instance="${deps.escapeHtml(String(options.instance ?? ""))}" data-prop-key="${deps.escapeHtml(options.key ?? "")}"`
    : `data-live-reactive-input="true" data-reactive-rid="${deps.escapeHtml(options.rid ?? "")}"`;

  return `
    <input
      class="inspector-live-input"
      type="${inputType}"
      value="${deps.escapeHtml(String(options.value))}"
      ${dataAttributes}
    />
  `;
}

export function renderInspectorComposablesPanel(
  expandedValuePaths: Set<string>,
  selected: InspectorMountedComponent,
  composablesSnapshot: Array<{ name: string; state: Record<string, unknown> }>,
  query: string,
  deps: InspectorInteractiveSectionDeps
): string {
  if (!composablesSnapshot || composablesSnapshot.length === 0) return "";

  return `
    <div class="inspector-control-list">
      ${composablesSnapshot.map(c => `
        <details class="inspector-dropdown">
          <summary class="inspector-dropdown-summary">
            <span class="inspector-dropdown-label">
              <span class="inspector-dropdown-origin">composable</span>
              <span class="inspector-dropdown-key">${deps.escapeHtml(c.name)}</span>
            </span>
          </summary>

          <div class="inspector-dropdown-body">
            ${Object.entries(c.state).map(([key, value]) => {
              const resolved = deps.unwrapInspectableValue(value);
              const editable = deps.describeEditablePrimitive(resolved);
              const typeLabel = deps.describeInspectableValueType(value);

              const editorMarkup =
                editable && editable.type === "boolean"
                  ? `<div class="inspector-inline-edit-row">${renderPrimitiveEditorControl({
                      kind: "reactive",
                      rid: `${c.name}.${key}`,
                      value: editable.value,
                      valueType: editable.type
                    }, deps)}</div>`
                  : "";

              const valueMarkup = deps.isExpandableValue(resolved)
                ? deps.renderValueExplorer(resolved, `composables.${c.name}.${key}`, expandedValuePaths)
                : editable && editable.type === "boolean"
                  ? ""
                  : `<div class="inspector-inline-value">${deps.escapeHtml(deps.formatPrimitiveValue(resolved))}</div>`;

              return `
                <details class="inspector-dropdown">
                  <summary class="inspector-dropdown-summary">
                    <span class="inspector-dropdown-label">
                      <span class="inspector-dropdown-key">${deps.escapeHtml(key)}</span>
                      <span class="inspector-dropdown-type">: ${deps.escapeHtml(typeLabel)}</span>
                    </span>
                  </summary>
                  <div class="inspector-dropdown-body">
                    ${editorMarkup}
                    ${valueMarkup}
                  </div>
                </details>
              `;
            }).join("")}
          </div>
        </details>
      `).join("")}
    </div>
  `;
}

