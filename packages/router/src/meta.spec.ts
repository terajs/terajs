import { describe, expect, it } from "vitest";
import type { RouteDefinition } from "./definition";
import { resolveLoadedRouteMetadata } from "./meta";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "page",
    path: "/docs",
    filePath: "/pages/docs.tera",
    component: async () => ({ default: null }),
    layout: null,
    middleware: [],
    prerender: true,
    hydrate: "eager",
    edge: false,
    meta: {},
    layouts: [],
    ...overrides
  };
}

describe("resolveLoadedRouteMetadata", () => {
  it("merges outer layout, inner layout, and page metadata in order", () => {
    const resolved = resolveLoadedRouteMetadata({
      match: {
        route: route({
          meta: { title: "Docs", description: "Page", keywords: ["page"] },
          ai: { summary: "page summary" },
          hydrate: "visible",
          layouts: [
            { id: "root", filePath: "/pages/layout.tera", component: async () => ({ default: null }) },
            { id: "docs", filePath: "/pages/docs/layout.tera", component: async () => ({ default: null }) }
          ]
        }),
        pathname: "/docs",
        fullPath: "/docs",
        params: {},
        query: {},
        hash: ""
      },
      module: {},
      component: Object.assign(() => null, {
        meta: { keywords: ["component"], analytics: { events: ["view"] } },
        ai: { summary: "component summary", tone: "guide" }
      }),
      layouts: [
        {
          definition: { id: "root", filePath: "/pages/layout.tera", component: async () => ({ default: null }) },
          module: {},
          component: Object.assign(() => null, {
            meta: { title: "Terajs", keywords: ["tera"], analytics: { track: true } },
            ai: { summary: "root summary" },
            route: { layout: "root-shell" }
          })
        },
        {
          definition: { id: "docs", filePath: "/pages/docs/layout.tera", component: async () => ({ default: null }) },
          module: {},
          component: Object.assign(() => null, {
            meta: { description: "Docs layout", keywords: ["docs"] },
            ai: { audience: "developers" }
          })
        }
      ],
      resolved: undefined as never,
      data: undefined
    });

    expect(resolved.meta).toEqual({
      title: "Docs",
      description: "Page",
      keywords: ["tera", "docs", "page", "component"],
      analytics: { track: true, events: ["view"] }
    });
    expect(resolved.ai).toEqual({
      summary: "component summary",
      audience: "developers",
      tone: "guide"
    });
    expect(resolved.route.path).toBe("/docs");
    expect(resolved.route.layouts).toEqual(["root", "docs"]);
    expect(resolved.route.layout).toBe("root-shell");
    expect(resolved.route.hydrate).toBe("visible");
  });
});