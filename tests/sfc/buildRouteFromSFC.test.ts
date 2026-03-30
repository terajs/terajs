import { describe, it, expect } from "vitest";
import { buildRouteFromSFC } from "../../src/routing/routes";
import { ParsedSFC, type MetaConfig } from "@nebula/sfc/types.js";

function mockSFC(overrides: Partial<ParsedSFC>): ParsedSFC {
  return {
    filePath: "/pages/test.nbl",
    template: "",
    script: "",
    style: null,
    meta: {} as MetaConfig,
    routeOverride: null,
    ...overrides
  };
}

describe("buildRouteFromSFC", () => {
  it("builds default route", () => {
    const route = buildRouteFromSFC(mockSFC({}));

    expect(route.path).toBe("/test");
    expect(route.layout).toBeNull();
    expect(route.prerender).toBe(true);
    expect(route.hydrate).toBe("eager");
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
