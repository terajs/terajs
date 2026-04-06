import { describe, expect, it, vi } from "vitest";
import { Debug } from "@terajs/shared";
import type { RouteDefinition } from "./builder";
import {
  createMemoryHistory,
  createRouter,
  matchRoute,
  type NavigationGuard
} from "./runtime";

const loadComponent = async () => ({ default: null });

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.nbl",
    component: loadComponent,
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

describe("matchRoute", () => {
  it("extracts params, query, and hash", () => {
    const matched = matchRoute(
      [route({ path: "/blog/:slug", filePath: "/pages/blog/[slug].nbl" })],
      "/blog/hello-world?draft=1&tag=tera&tag=router#summary"
    );

    expect(matched).not.toBeNull();
    expect(matched?.params).toEqual({ slug: "hello-world" });
    expect(matched?.query).toEqual({ draft: "1", tag: ["tera", "router"] });
    expect(matched?.hash).toBe("summary");
  });

  it("prefers static routes over param routes", () => {
    const matched = matchRoute(
      [
        route({ path: "/blog/:slug", filePath: "/pages/blog/[slug].nbl" }),
        route({ path: "/blog/new", filePath: "/pages/blog/new.nbl" })
      ],
      "/blog/new"
    );

    expect(matched?.route.filePath).toBe("/pages/blog/new.nbl");
  });
});

describe("createRouter", () => {
  it("starts from history and exposes current route", async () => {
    const history = createMemoryHistory("/dashboard?tab=signals");
    const router = createRouter([
      route({ path: "/dashboard", filePath: "/pages/dashboard.nbl" })
    ], { history });

    const result = await router.start();

    expect(result.type).toBe("success");
    expect(router.getCurrentRoute()?.query).toEqual({ tab: "signals" });
  });

  it("navigates and notifies subscribers", async () => {
    const history = createMemoryHistory("/");
    const router = createRouter([
      route({ path: "/", filePath: "/pages/index.nbl" }),
      route({ path: "/docs/:section", filePath: "/pages/docs/[section].nbl" })
    ], { history });
    const listener = vi.fn();

    router.subscribe(listener);
    await router.start();
    const result = await router.navigate("/docs/router");

    expect(result.type).toBe("success");
    expect(router.getCurrentRoute()?.params).toEqual({ section: "router" });
    expect(history.getLocation()).toBe("/docs/router");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("blocks navigation when middleware returns false", async () => {
    const debugSpy = vi.spyOn(Debug, "emit");
    const authGuard: NavigationGuard = () => false;
    const history = createMemoryHistory("/");
    const router = createRouter(
      [
        route({ path: "/", filePath: "/pages/index.nbl" }),
        route({ path: "/admin", filePath: "/pages/admin.nbl", middleware: ["auth"] })
      ],
      {
        history,
        middleware: { auth: authGuard }
      }
    );

    await router.start();
    const result = await router.navigate("/admin");

    expect(result).toEqual({
      type: "blocked",
      from: expect.objectContaining({ pathname: "/" }),
      to: "/admin"
    });
    expect(router.getCurrentRoute()?.pathname).toBe("/");
    expect(history.getLocation()).toBe("/");
    expect(debugSpy).toHaveBeenCalledWith(
      "route:warn",
      expect.objectContaining({ to: "/admin" })
    );
    debugSpy.mockRestore();
  });

  it("redirects navigation when middleware returns a path", async () => {
    const authGuard: NavigationGuard = ({ to }) =>
      to.pathname === "/admin" ? "/signin?redirect=%2Fadmin" : true;
    const history = createMemoryHistory("/");
    const router = createRouter(
      [
        route({ path: "/", filePath: "/pages/index.nbl" }),
        route({ path: "/admin", filePath: "/pages/admin.nbl", middleware: ["auth"] }),
        route({ path: "/signin", filePath: "/pages/signin.nbl" })
      ],
      {
        history,
        middleware: { auth: authGuard }
      }
    );

    await router.start();
    const result = await router.navigate("/admin");

    expect(result.type).toBe("redirect");
    expect(router.getCurrentRoute()?.pathname).toBe("/signin");
    expect(router.getCurrentRoute()?.query).toEqual({ redirect: "/admin" });
    expect(history.getLocation()).toBe("/signin?redirect=%2Fadmin");
  });

  it("emits a router error when no route matches", async () => {
    const debugSpy = vi.spyOn(Debug, "emit");
    const router = createRouter([], { history: createMemoryHistory("/") });

    const result = await router.navigate("/missing");

    expect(result).toEqual({
      type: "not-found",
      from: null,
      to: "/missing"
    });
    expect(debugSpy).toHaveBeenCalledWith(
      "error:router",
      expect.objectContaining({ to: "/missing" })
    );
    debugSpy.mockRestore();
  });
});