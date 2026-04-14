import { describe, expect, it } from "vitest";

import { appendPrioritizedDevtoolsEvent, retainPrioritizedDevtoolsEvents } from "./eventRetention.js";

describe("event retention", () => {
  it("drops low-signal DOM and read events before semantic runtime events", () => {
    const events = retainPrioritizedDevtoolsEvents([
      { type: "dom:create" },
      { type: "dom:update" },
      { type: "reactive:read" },
      { type: "watch:create" },
      { type: "computed:create" },
      { type: "watchEffect:create" }
    ], 3);

    expect(events.map((event) => event.type)).toEqual([
      "watch:create",
      "computed:create",
      "watchEffect:create"
    ]);
  });

  it("falls back to FIFO trimming when only semantic events remain", () => {
    const events = retainPrioritizedDevtoolsEvents([
      { type: "watch:create" },
      { type: "computed:create" },
      { type: "watchEffect:create" }
    ], 2);

    expect(events.map((event) => event.type)).toEqual([
      "computed:create",
      "watchEffect:create"
    ]);
  });

  it("preserves semantic events when appending beyond the cap", () => {
    const events = appendPrioritizedDevtoolsEvent([
      { type: "dom:update" },
      { type: "watch:create" },
      { type: "computed:create" }
    ], { type: "watchEffect:create" }, 3);

    expect(events.map((event) => event.type)).toEqual([
      "watch:create",
      "computed:create",
      "watchEffect:create"
    ]);
  });
});