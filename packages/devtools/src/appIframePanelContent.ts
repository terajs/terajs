import type { DevtoolsEvent } from "./app.js";
import type { SafeDocumentContext } from "./documentContext.js";
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
  selectedMetaKey: string | null;
  expandedValuePaths: Set<string>;
  issueFilter: "all" | "error" | "warn";
  logFilter: "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";
  timelineCursor: number;
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
      return renderSignalsPanel({ events: state.events });
    case "Meta":
      return renderMetaPanel({
        events: state.events,
        selectedMetaKey: state.selectedMetaKey,
        expandedValuePaths: state.expandedValuePaths
      }, documentContext);
    case "Issues":
      return renderIssuesPanel({
        events: state.events,
        issueFilter: state.issueFilter
      });
    case "Logs":
      return renderLogsPanel({
        events: routeEvents,
        logFilter: state.logFilter
      });
    case "Timeline":
      return renderTimelinePanel({
        events: routeEvents,
        timelineCursor: state.timelineCursor
      });
    case "Router":
      return renderRouterPanel(routeEvents);
    case "Queue":
      return renderQueuePanel(routeEvents);
    case "Performance":
      return renderPerformancePanel(routeEvents);
    case "Sanity Check":
      return renderSanityPanel(routeEvents);
    default:
      return "";
  }
}