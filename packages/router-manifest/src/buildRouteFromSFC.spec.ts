import { describe, it, expect } from "vitest";
import type { ParsedSFC } from "@terajs/sfc";
import { buildRouteFromSFC } from "./index";

function mockSFC(overrides: Partial<ParsedSFC>): ParsedSFC {
  return {
    filePath: "/pages/test.nbl",
    template: "",
    script: "",
    style: null,
    meta: {},
    routeOverride: null,
    ...overrides
  };
}

describe("buildRouteFromSFC", () => {
  it("builds default route", () => {
    const route = buildRouteFromSFC(mockSFC({}));

    expect(route.id).toBe("test");
    expect(route.path).toBe("/test");
    expect(route.layout).toBeNull();
    expect(route.prerender).toBe(true);
    expect(route.hydrate).toBe("eager");
    expect(route.layouts).toEqual([]);
  });

  it("applies route overrides", () => {
    const route = buildRouteFromSFC(
      mockSFC({
        routeOverride: {
          path: "/custom",
          layout: "admin",
          prerender: false,
          hydrate: "visible",
          middleware: ["auth"]
        }
      })
    );

    expect(route.path).toBe("/custom");
    expect(route.layout).toBe("admin");
    expect(route.prerender).toBe(false);
    expect(route.hydrate).toBe("visible");
    expect(route.middleware).toEqual(["auth"]);
  });
});