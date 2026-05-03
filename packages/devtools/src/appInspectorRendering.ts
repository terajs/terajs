import type { DevtoolsEvent } from "./app.js";
import {
  renderInspectorRuntimeMonitor as renderRuntimeMonitorPanel,
  type RuntimeMonitorRenderUtils
} from "./inspector/runtimeMonitor.js";
import {
  buildComponentKey,
  describeValueType,
  escapeHtml,
  matchesInspectorQuery,
  readComponentIdentity,
  readNumber,
  readString,
  readUnknown,
  safeString,
  shortJson
} from "./inspector/shared.js";
import { formatPrimitiveValue, isExpandableValue, renderValueExplorer } from "./inspector/valueExplorer.js";
import {
  renderInspectorAiPanel,
  renderInspectorActivityPanel,
  renderInspectorDomPanel,
  renderInspectorMetaPanel,
  renderInspectorOverviewPanel,
  renderInspectorRoutePanel
} from "./inspector/basicSections.js";
import {
  renderInspectorPropsPanel,
  renderInspectorReactivePanel,
  renderInspectorComposablesPanel,
  type InspectorInteractiveSectionDeps
} from "./inspector/interactiveSections.js";
import {
  describeEditablePrimitive,
  describeInspectableValueType,
  unwrapInspectableValue,
} from "./inspector/editableValues.js";
import { collectOwnedReactiveEntries } from "./inspector/dataCollectors.js";
import type { MountedComponentEntry } from "./inspector/componentData.js";
import {
  renderComponentDrilldownInspector as renderDrilldownInspector,
  type InspectorDrilldownSnapshot,
  type InspectorDrilldownState,
  type InspectorSectionRenderers
} from "./inspector/drilldownRenderer.js";
import { resolveLivePropsSnapshot } from "./inspector/liveEditing.js";

const runtimeMonitorRenderUtils: RuntimeMonitorRenderUtils = {
  buildComponentKey,
  readComponentIdentity,
  matchesInspectorQuery,
  readUnknown,
  readString,
  readNumber,
  shortJson,
  safeString,
  escapeHtml,
  describeValueType
};

function renderInspectorRuntimeMonitor(
  events: DevtoolsEvent[],
  scope: string,
  instance: number,
  query: string
): string {
  return renderRuntimeMonitorPanel(events, scope, instance, query, runtimeMonitorRenderUtils);
}

const inspectorInteractiveSectionDeps: InspectorInteractiveSectionDeps = {
  resolveLivePropsSnapshot,
  renderInspectorRuntimeMonitor,
  matchesInspectorQuery,
  collectOwnedReactiveEntries,
  renderValueExplorer,
  escapeHtml,
  isExpandableValue,
  formatPrimitiveValue,
  describeEditablePrimitive,
  describeInspectableValueType,
  unwrapInspectableValue
};

const inspectorSectionRenderers: InspectorSectionRenderers = {
  overview: renderInspectorOverviewPanel,
  props: (state, selected, drilldown, query) => {
    return renderInspectorPropsPanel(
      state.events,
      state.expandedValuePaths,
      selected,
      drilldown.propsSnapshot,
      query,
      inspectorInteractiveSectionDeps
    );
  },
  dom: renderInspectorDomPanel,
  reactive: (state, selected, drilldown, query) => {
    return renderInspectorReactivePanel(
      state.expandedValuePaths,
      selected,
      drilldown.reactiveState,
      query,
      inspectorInteractiveSectionDeps
    );
  },
  route: (state, drilldown, query) => {
    return renderInspectorRoutePanel(drilldown, query, state.expandedValuePaths);
  },
  meta: (state, drilldown, query) => {
    return renderInspectorMetaPanel(drilldown, query, state.expandedValuePaths);
  },
  ai: (state, drilldown, query) => {
    return renderInspectorAiPanel(drilldown, query, state.expandedValuePaths);
  },
  activity: renderInspectorActivityPanel,
  composables: (state, selected, drilldown, query) => {
    return renderInspectorComposablesPanel(
      state.expandedValuePaths,
      selected,
      drilldown.composablesSnapshot,
      query,
      inspectorInteractiveSectionDeps
    );
  }
};

export function renderComponentDrilldownFromState(
  state: InspectorDrilldownState,
  selected: MountedComponentEntry,
  drilldown: InspectorDrilldownSnapshot
): string {
  return renderDrilldownInspector(state, selected, drilldown, inspectorSectionRenderers);
}