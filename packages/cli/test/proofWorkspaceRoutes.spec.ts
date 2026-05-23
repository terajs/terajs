import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { clearDebugHistory, normalizeSharedDebugEvent, readDebugHistory } from "@terajs/shared";
import type { RouteDefinition } from "../../router/src/definition.js";
import { createMemoryHistory, createRouter } from "../../router/src/runtime.js";

import { runBuildCommand } from "../src/build.js";
import {
  cleanupProofWorkspaceCopies,
  copyProofWorkspace,
} from "./proofWorkspaceTestHarness.js";

function createProofRouteDefinition(route: {
  id: string;
  path: string;
  filePath: string;
  layout?: string;
  mountTarget?: string;
  asset?: string;
  middleware: string[];
  prerender: boolean;
  hydrate: string;
  edge: boolean;
  meta: Record<string, unknown>;
  layouts: Array<{ id: string; filePath: string }>;
}): RouteDefinition {
  return {
    id: route.id,
    path: route.path,
    filePath: route.filePath,
    component: async () => ({ default: null }),
    layout: route.layout,
    mountTarget: route.mountTarget,
    asset: route.asset,
    middleware: route.middleware,
    prerender: route.prerender,
    hydrate: route.hydrate as RouteDefinition["hydrate"],
    edge: route.edge,
    meta: route.meta,
    layouts: route.layouts.map((layout) => ({
      ...layout,
      component: async () => ({ default: null })
    }))
  };
}

afterEach(async () => {
  await cleanupProofWorkspaceCopies();
});

describe("proof workspace routes", () => {
  it("emits the home route and parameterized detail route through the shared layout", async () => {
    const tempWorkspace = await copyProofWorkspace();

    process.chdir(tempWorkspace);
    await runBuildCommand({ target: ["android"] }, { cwd: tempWorkspace });

    const routes = JSON.parse(
      await readFile(path.join(tempWorkspace, ".terajs", "generated", "android", "routes.json"), "utf8")
    ) as Array<{
      id: string;
      path: string;
      filePath: string;
      layout?: string;
      mountTarget?: string;
      asset?: string;
      middleware: string[];
      prerender: boolean;
      hydrate: string;
      edge: boolean;
      meta: Record<string, unknown>;
      layouts: Array<{ id: string; filePath: string }>;
    }>;

    expect(routes).toHaveLength(2);
    expect(routes[0]).toMatchObject({
      id: "index",
      path: "/",
      filePath: "/src/shared/pages/index.tera",
      middleware: [],
      prerender: true,
      hydrate: "eager",
      edge: false,
      layouts: [
        {
          id: "root",
          filePath: "/src/shared/pages/layout.tera"
        }
      ]
    });
    expect(routes[1]).toMatchObject({
      id: "stories/[id]",
      path: "/stories/:id",
      filePath: "/src/shared/pages/stories/[id].tera",
      middleware: [],
      prerender: true,
      hydrate: "eager",
      edge: false,
      layouts: [
        {
          id: "root",
          filePath: "/src/shared/pages/layout.tera"
        }
      ]
    });

    const router = createRouter(
      routes.map((route) => createProofRouteDefinition(route)),
      { history: createMemoryHistory("/") }
    );
    await router.start();

    clearDebugHistory();
    const result = await router.navigate("/stories/bravo");

    expect(result.type).toBe("success");

    const routeEvents = readDebugHistory().flatMap((event) => {
      const normalized = normalizeSharedDebugEvent(event);
      return normalized && normalized.type.startsWith("route:") ? [normalized] : [];
    });

    expect(routeEvents.find((event) => event.type === "route:navigate:start")?.payload).toMatchObject({
      to: "/stories/bravo"
    });
    expect(routeEvents.find((event) => event.type === "route:changed")?.payload).toMatchObject({
      to: "/stories/bravo",
      route: "/stories/:id",
      params: { id: "bravo" }
    });
  });
});