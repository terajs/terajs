import { describe, expect, it, vi } from "vitest";
import { Debug } from "@terajs/shared";
import type { RouteDefinition } from "./definition";
import {
  clearPrefetchedRouteMatches,
  createRouteHydrationSnapshot,
  loadRouteMatch,
  prefetchRouteMatch,
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

  it("emits load phases and duration for route loads", async () => {
    const debugSpy = vi.spyOn(Debug, "emit");
    const matched = matchRoute(
      [
        route({
          path: "/docs",
          filePath: "/pages/docs.tera",
          component: async () => ({
            default: "DocsPage",
            load: () => ({ section: "docs" })
          })
        })
      ],
      "/docs"
    );

    expect(matched).not.toBeNull();

    await loadRouteMatch(matched!);

    expect(debugSpy).toHaveBeenCalledWith(
      "route:load:start",
      expect.objectContaining({
        to: "/docs",
        route: "/docs",
        params: {},
        query: {},
        hydrated: false,
        phase: "loading"
      })
    );
    expect(debugSpy).toHaveBeenCalledWith(
      "route:load:end",
      expect.objectContaining({
        to: "/docs",
        route: "/docs",
        params: {},
        query: {},
        hasData: true,
        hydrated: false,
        phase: "loaded",
        durationMs: expect.any(Number)
      })
    );
    expect(debugSpy).toHaveBeenCalledWith(
      "route:meta:resolved",
      expect.objectContaining({
        to: "/docs",
        params: {},
        query: {},
        phase: "resolved",
        durationMs: expect.any(Number)
      })
    );
    debugSpy.mockRestore();
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

  it("rejects a route load when the abort signal fires before the module resolves", async () => {
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

    const controller = new AbortController();
    const pending = loadRouteMatch(matched!, {
      signal: controller.signal
    });
    await Promise.resolve();

    expect(routeStarted).toHaveBeenCalledTimes(1);
    expect(layoutStarted).toHaveBeenCalledTimes(1);

    controller.abort("prefetch-cancelled");
    releaseRouteModule?.({ default: "ProductPage" });

    await expect(pending).rejects.toMatchObject({
      name: "AbortError"
    });
  });

  it("does not reuse a prefetched route load after that prefetch is aborted", async () => {
    let releaseRouteModule: ((value: { default: string }) => void) | undefined;
    const componentSpy = vi.fn()
      .mockImplementationOnce(() => new Promise<{ default: string }>((resolve) => {
        releaseRouteModule = resolve;
      }))
      .mockResolvedValueOnce({ default: "DocsPage" });
    const router = createRouter([
      route({
        id: "docs",
        path: "/docs",
        filePath: "/pages/docs.tera",
        component: componentSpy
      })
    ]);

    const matched = router.resolve("/docs");
    expect(matched).not.toBeNull();

    const controller = new AbortController();
    const pendingPrefetch = prefetchRouteMatch(matched!, controller.signal);
    await Promise.resolve();

    controller.abort("prefetch-cancelled");
    releaseRouteModule?.({ default: "DocsPage" });

    await expect(pendingPrefetch).rejects.toMatchObject({
      name: "AbortError"
    });

    const loaded = await loadRouteMatch(matched!);
    expect(loaded.component).toBe("DocsPage");
    expect(componentSpy).toHaveBeenCalledTimes(2);

    clearPrefetchedRouteMatches();
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