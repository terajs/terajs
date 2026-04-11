import { describe, expect, it } from "vitest";
import { signal } from "@terajs/reactivity";
import {
  createRouter,
  type RouteDefinition,
  type RouterHistory
} from "@terajs/router";

import { mount, unmount } from "./mount";
import { createRouteView } from "./routerView";

interface CountingHistory extends RouterHistory {
  activeListeners(): number;
}

function createCountingHistory(initialPath = "/"): CountingHistory {
  let currentPath = initialPath;
  const listeners = new Set<(path: string) => void>();

  const notify = (path: string) => {
    for (const listener of listeners) {
      listener(path);
    }
  };

  return {
    getLocation: () => currentPath,
    push: (path) => {
      currentPath = path;
      notify(path);
    },
    replace: (path) => {
      currentPath = path;
      notify(path);
    },
    listen: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    activeListeners: () => listeners.size
  };
}

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "home",
    path: "/",
    filePath: "/pages/index.tera",
    component: async () => ({ default: () => document.createTextNode("home") }),
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

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("stress and leak regressions", () => {
  it("does not trigger template updates after unmount churn", () => {
    const root = document.createElement("div");
    const value = signal(0);
    let runs = 0;

    const App = () => () => {
      runs += 1;
      const node = document.createElement("div");
      node.textContent = String(value());
      return node;
    };

    for (let i = 0; i < 40; i += 1) {
      mount(App, root);
      value.set(i + 1);
      unmount(root);
    }

    const runsAfterChurn = runs;

    for (let i = 0; i < 10; i += 1) {
      value.set(1000 + i);
    }

    expect(runs).toBe(runsAfterChurn);
    expect(root.textContent).toBe("");
  });

  it("keeps a single live node under high-frequency reactive updates", () => {
    const root = document.createElement("div");
    const tick = signal(0);

    const App = () => () => {
      const span = document.createElement("span");
      span.setAttribute("data-value", String(tick()));
      span.textContent = String(tick());
      return span;
    };

    mount(App, root);

    for (let i = 1; i <= 120; i += 1) {
      tick.set(i);
    }

    expect(root.querySelectorAll("span")).toHaveLength(1);
    expect(root.textContent).toBe("120");

    unmount(root);
    expect(root.textContent).toBe("");
  });

  it("does not leak router history listeners across route-view churn", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    for (let i = 0; i < 20; i += 1) {
      const history = createCountingHistory("/");
      const router = createRouter(
        [
          route({
            id: "home",
            path: "/",
            component: async () => ({ default: () => document.createTextNode("home") })
          }),
          route({
            id: "about",
            path: "/about",
            component: async () => ({ default: () => document.createTextNode("about") })
          })
        ],
        { history }
      );

      mount(createRouteView(router), root);
      await flush();
      await router.navigate("/about");
      await flush();

      unmount(root);
      router.stop();

      expect(history.activeListeners()).toBe(0);
      expect(root.textContent).toBe("");
    }

    root.remove();
  });
});
