/**
 * @file component.spec.ts
 * Tests runtime component meta/AI/route access from SFC pipeline.
 */
import { describe, it, expect } from "vitest";
import { component } from "./component";

describe("component() meta/AI integration", () => {
  it("attaches meta, ai, and route to the component options", () => {
    const meta = { title: "Test", description: "desc" };
    const ai = { keywords: ["foo", "bar"] };
    const route = { layout: "main" };
    const Comp = component({ name: "Test", meta, ai, route }, () => () => null);
    // Meta/AI/route should be accessible on the component wrapper
    expect(Comp.meta).toEqual(meta);
    expect(Comp.ai).toEqual(ai);
    expect(Comp.route).toEqual(route);
  });
});
