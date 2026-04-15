import { describe, expect, it } from "vitest";
import { renderIssuesPanel, renderLogsPanel, renderTimelinePanel } from "./primaryPanels.js";

describe("primaryPanels", () => {
  it("renders issues and logs with the modern split-pane result list", () => {
    const issuesMarkup = renderIssuesPanel({
      events: [{
        type: "lifecycle:warn",
        timestamp: 100,
        level: "warn",
        payload: { message: "Warn once" }
      }],
      issueFilter: "all"
    });

    const logsMarkup = renderLogsPanel({
      events: [{
        type: "route:changed",
        timestamp: 101,
        payload: { to: "/docs" }
      }],
      logFilter: "all"
    });

    expect(issuesMarkup).toContain("issues-panel-layout");
    expect(issuesMarkup).toContain("iframe-results-list");
    expect(issuesMarkup).not.toContain("stack-list log-list");

    expect(logsMarkup).toContain("logs-panel-layout");
    expect(logsMarkup).toContain("iframe-results-list");
    expect(logsMarkup).not.toContain("stack-list log-list");
  });

  it("filters timeline results to replayed entries instead of rendering inactive rows", () => {
    const markup = renderTimelinePanel({
      events: [
        { type: "effect:run", timestamp: 1, payload: { key: "alpha" } },
        { type: "signal:update", timestamp: 2, payload: { key: "beta", value: 2 } },
        { type: "route:changed", timestamp: 3, payload: { to: "/later" } }
      ],
      timelineCursor: 1
    });

    expect(markup).toContain("Replaying 2 / 3 events | 1 hidden ahead");
    expect(markup).toContain("key=alpha value=undefined");
    expect(markup).toContain("key=beta value=2");
    expect(markup).not.toContain("to=/later");
    expect(markup).not.toContain("timeline-inactive");
    expect(markup).toContain("iframe-results-list");
  });
});