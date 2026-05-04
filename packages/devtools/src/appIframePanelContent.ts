import type { DevtoolsEvent, IframePanelsState } from "./app.js";
import type { SafeDocumentContext } from "./documentContext.js";
import type { InspectorSectionKey } from "./inspector/drilldownRenderer.js";
import { RouteSessions } from "./routeSessions.js";
import {
  renderIssuesPanel,
  renderLogsPanel,
  renderMetaPanel,
  renderSignalsPanel,
  renderTimelinePanel,
} from "./panels/primaryPanels.js";
import {
  renderPerformancePanel,
  renderQueuePanel,
  renderRouterPanel,
  renderSanityPanel,
} from "./panels/diagnosticsPanels.js";

interface IframePanelState {
  activeTab: string;
  events: DevtoolsEvent[];
  iframePanels: IframePanelsState;
  expandedInspectorSections: Set<InspectorSectionKey>;
  expandedValuePaths: Set<string>;
}

function getRouteEvents(state: IframePanelState, routeSessions: RouteSessions): DevtoolsEvent[] {
  return routeSessions
    .getCurrentRouteEvents(state.events)
    .filter((event) => !event.type.startsWith("hydration:"));
}

export function renderIframePanelContent(
  state: IframePanelState,
  routeSessions: RouteSessions,
  documentContext: SafeDocumentContext | null = null
): string {
  const routeEvents = getRouteEvents(state, routeSessions);

  switch (state.activeTab) {
    case "Signals":
      return renderSignalsPanel({
        events: state.events,
        selectedSignalKey: state.iframePanels.signals.selectedKey,
        signalSearchQuery: state.iframePanels.signals.searchQuery,
        signalViewMode: state.iframePanels.signals.viewMode,
        expandedValuePaths: state.expandedValuePaths,
      });
    case "Meta":
      return renderMetaPanel({
        events: state.events,
        selectedMetaKey: state.iframePanels.meta.selectedKey,
        metaSearchQuery: state.iframePanels.meta.searchQuery,
        expandedValuePaths: state.expandedValuePaths
      }, documentContext);
    case "Issues":
      return renderIssuesPanel({
        events: state.events,
        issueFilter: state.iframePanels.issues.filter,
        selectedIssueKey: state.iframePanels.issues.selectedKey,
        expandedValuePaths: state.expandedValuePaths,
      });
    case "Logs":
      return renderLogsPanel({
        events: routeEvents,
        logFilter: state.iframePanels.logs.filter,
        selectedLogEntryKey: state.iframePanels.logs.selectedEntryKey,
        logSearchQuery: state.iframePanels.logs.searchQuery,
        expandedValuePaths: state.expandedValuePaths,
      });
    case "Timeline":
      return renderTimelinePanel({
        events: routeEvents,
        timelineFilter: state.iframePanels.timeline.filter,
        expandedValuePaths: state.expandedValuePaths,
        expandedDetailKeys: state.iframePanels.timeline.expandedDetailKeys,
      });
    case "Router":
      return renderRouterPanel({
        events: routeEvents,
        expandedValuePaths: state.expandedValuePaths,
        activeRouterView: state.iframePanels.router.activeView,
      });
    case "Queue":
      return renderQueuePanel({
        events: routeEvents,
        selectedQueueEntryKey: state.iframePanels.queue.selectedEntryKey,
        expandedValuePaths: state.expandedValuePaths,
      });
    case "Performance":
      return renderPerformancePanel({
        events: routeEvents,
        activePerformanceView: state.iframePanels.performance.activeView,
      });
    case "Sanity Check":
      return renderSanityPanel({
        events: routeEvents,
        activeSanityView: state.iframePanels.sanity.activeView,
      });
    default:
      return "";
  }
}