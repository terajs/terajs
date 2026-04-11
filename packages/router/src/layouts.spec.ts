import { describe, expect, it, vi } from "vitest";
import type { RouteDefinition } from "./definition";
import { resolveComponentStack } from "./runtime";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "page",
    path: "/",
    filePath: "/pages/index.tera",
    component: async () => ({ default: null }),
    layout: null,
    middleware: [],
    prerender: true,
    hydrate: "eager",
    edge: false,
    meta: {},
    ai: undefined,
    layouts: [],
    ...overrides
  };
}

describe("layout-aware route resolution", () => {
  it("preserves layout component identity across sibling routes", () => {
    const Layout = vi.fn((props: any) => props.children());
    const PageA = async () => "PageA";
    const PageB = async () => "PageB";

    const routeA = route({ path: "/a", component: PageA, layout: Layout });
    const routeB = route({ path: "/b", component: PageB, layout: Layout });

    const stackA = resolveComponentStack(routeA);
    const stackB = resolveComponentStack(routeB);

    expect(stackA[0]).toBe(Layout);
    expect(stackB[0]).toBe(Layout);
    expect(stackA[1]).toBe(PageA);
    expect(stackB[1]).toBe(PageB);
    expect(stackA[0]).toBe(stackB[0]);
  });
});
