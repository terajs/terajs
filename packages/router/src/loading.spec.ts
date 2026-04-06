import { describe, expect, it } from "vitest";
import type { RouteDefinition } from "./builder";
import { loadRouteMatch, type RouteLoadContext } from "./loading";
import { matchRoute } from "./runtime";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.nbl",
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

describe("loadRouteMatch", () => {
  it("loads component, layout chain, and route data", async () => {
    const matched = matchRoute(
      [
        route({
          path: "/products/:id",
          filePath: "/pages/products/[id].nbl",
          component: async () => ({
            default: "ProductPage",
            load: ({ params, query }: RouteLoadContext) => ({ id: params.id, view: query.view })
          }),
          layouts: [
            {
              id: "root",
              filePath: "/pages/layout.nbl",
              component: async () => ({ default: "RootLayout" })
            },
            {
              id: "products",
              filePath: "/pages/products/layout.nbl",
              component: async () => ({ default: "ProductsLayout" })
            }
          ]
        })
      ],
      "/products/42?view=full"
    );

    expect(matched).not.toBeNull();

    const loaded = await loadRouteMatch(matched!);

    expect(loaded.component).toBe("ProductPage");
    expect(loaded.layouts.map((layout) => layout.component)).toEqual([
      "RootLayout",
      "ProductsLayout"
    ]);
    expect(loaded.data).toEqual({ id: "42", view: "full" });
  });
});