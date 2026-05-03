import { describe, expect, it, vi } from "vitest";
import type { RouteDefinition } from "./definition";
import {
  clearPrefetchedRouteMatches,
  createRouteHydrationSnapshot,
  loadRouteMatch,
  prefetchRoute,
  type RouteLoadContext
} from "./loading";
import { createRouter, matchRoute } from "./runtime";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.tera",
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
  it("reuses prefetched route loads on the next navigation render", async () => {
    const componentSpy = vi.fn(async () => ({
      default: "DocsPage",
      load: ({ pathname }: RouteLoadContext) => ({ pathname })
    }));
    const router = createRouter([
      route({
        id: "docs",
        path: "/docs",
        filePath: "/pages/docs.tera",
        component: componentSpy
      })
    ]);

    const prefetched = await prefetchRoute(router, "/docs");
    expect(prefetched?.data).toEqual({ pathname: "/docs" });
    expect(componentSpy).toHaveBeenCalledTimes(1);

    const matched = router.resolve("/docs");
    expect(matched).not.toBeNull();

    const loaded = await loadRouteMatch(matched!);
    expect(loaded.data).toEqual({ pathname: "/docs" });
    expect(componentSpy).toHaveBeenCalledTimes(1);

    clearPrefetchedRouteMatches();
  });

  it("loads component, layout chain, and route data", async () => {
    const matched = matchRoute(
      [
        route({
          path: "/products/:id",
          filePath: "/pages/products/[id].tera",
          component: async () => ({
            default: "ProductPage",
            load: ({ params, query }: RouteLoadContext) => ({ id: params.id, view: query.view })
          }),
          layouts: [
            {
              id: "root",
              filePath: "/pages/layout.tera",
              component: async () => ({ default: "RootLayout" })
            },
            {
              id: "products",
              filePath: "/pages/products/layout.tera",
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
    expect(loaded.resolved.meta).toEqual({});
    expect(loaded.resolved.route.layouts).toEqual(["root", "products"]);
  });

  it("starts layout imports before the route component resolves", async () => {
    let releaseRouteModule: ((value: { default: string }) => void) | undefined;
    const routeStarted = vi.fn();
    const layoutStarted = vi.fn();
    const matched = matchRoute(
      [
        route({
          path: "/products/:id",
          filePath: "/pages/products/[id].tera",
          component: () => {
            routeStarted();
            return new Promise<{ default: string }>((resolve) => {
              releaseRouteModule = resolve;
            });
          },
          layouts: [
            {
              id: "root",
              filePath: "/pages/layout.tera",
              component: async () => {
                layoutStarted();
                return { default: "RootLayout" };
              }
            }
          ]
        })
      ],
      "/products/42"
    );

    expect(matched).not.toBeNull();

    const pending = loadRouteMatch(matched!);
    await Promise.resolve();

    expect(routeStarted).toHaveBeenCalledTimes(1);
    expect(layoutStarted).toHaveBeenCalledTimes(1);

    releaseRouteModule?.({ default: "ProductPage" });

    const loaded = await pending;
    expect(loaded.component).toBe("ProductPage");
    expect(loaded.layouts.map((layout) => layout.component)).toEqual(["RootLayout"]);
  });

  it("reuses a hydration snapshot instead of rerunning the route loader", async () => {
    const loadSpy = vi.fn(({ params }: RouteLoadContext) => ({ id: params.id, hydrated: false }));
    const matched = matchRoute(
      [
        route({
          path: "/products/:id",
          filePath: "/pages/products/[id].tera",
          component: async () => ({
            default: "ProductPage",
            load: loadSpy
          })
        })
      ],
      "/products/42"
    );

    expect(matched).not.toBeNull();

    const firstLoad = await loadRouteMatch(matched!);
    const snapshot = createRouteHydrationSnapshot({
      ...firstLoad,
      data: { id: "42", hydrated: true }
    });

    const hydratedLoad = await loadRouteMatch(matched!, {
      hydrationSnapshot: snapshot
    });

    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(hydratedLoad.data).toEqual({ id: "42", hydrated: true });
    expect(hydratedLoad.resolved).toEqual(snapshot.resolved);
  });

  it("returns null when prefetching an unknown route", async () => {
    const router = createRouter([]);

    await expect(prefetchRoute(router, "/missing")).resolves.toBeNull();
  });
});