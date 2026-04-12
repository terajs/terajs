/**
 * @file component.spec.ts
 * Tests runtime component meta/AI/route access from SFC pipeline.
 */
import { describe, it, expect } from "vitest";
import { subscribeDebug } from "@terajs/shared";
import { component } from "./component";

describe("component() meta/AI integration", () => {
  it("attaches meta, ai, and route to the component options", () => {
    const meta = { title: "Test", description: "desc" };
    const ai = { keywords: ["foo", "bar"] };
    const route = { layout: "main" };
    const Comp = component({ name: "Test", meta, ai, route }, () => () => document.createElement("div"));
    // Meta/AI/route should be accessible on the component wrapper
    expect((Comp as any).meta).toEqual(meta);
    expect((Comp as any).ai).toEqual(ai);
    expect((Comp as any).route).toEqual(route);
  });

  it("emits meta, ai, and route on component:mounted", () => {
    const meta = { title: "Mounted Test", description: "desc" };
    const ai = { summary: "component summary" };
    const route = { layout: "docs", path: "/docs" };
    const events: Array<Record<string, unknown>> = [];
    const unsubscribe = subscribeDebug((event) => {
      if (event.type === "component:mounted") {
        events.push(event as unknown as Record<string, unknown>);
      }
    });

    try {
      const Comp = component({ name: "MountedMetaTest", meta, ai, route }, () => () => document.createElement("div"));
      Comp();
    } finally {
      unsubscribe();
    }

    expect(events.length).toBeGreaterThan(0);
    expect(events.at(-1)).toMatchObject({
      type: "component:mounted",
      scope: "MountedMetaTest",
      meta,
      ai,
      route
    });
  });
});
