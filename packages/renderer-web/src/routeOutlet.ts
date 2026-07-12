import type { LoadedRouteBranchEntry, LoadedRouteMatch, Router } from "@terajs/router";
import { getCurrentContext, onCleanup } from "@terajs/runtime";
import type { ComponentContext } from "@terajs/runtime";
import { unmount } from "./mount.js";

export interface RouteOutletController<TData = unknown> {
  readonly router: Router;
  getLoaded(): LoadedRouteMatch<TData> | null;
  setLoaded(loaded: LoadedRouteMatch<TData>): void;
  subscribe(listener: (loaded: LoadedRouteMatch<TData>) => void): () => void;
  renderDepth(
    loaded: LoadedRouteMatch<TData>,
    depth: number,
    outletsUsed: Set<number>
  ): Node;
}

export interface RouteOutletRenderContext<TData = unknown> {
  controller: RouteOutletController<TData>;
  depth: number;
  outletsUsed: Set<number>;
}

const routeOutletStack: RouteOutletRenderContext[] = [];
const ROUTE_OUTLET_CONTEXT = "__teraRouteOutletContext";

type RouteOutletComponentContext = ComponentContext & {
  [ROUTE_OUTLET_CONTEXT]?: RouteOutletRenderContext;
};

export function createRouteOutletController<TData>(
  router: Router,
  renderDepth: RouteOutletController<TData>["renderDepth"]
): RouteOutletController<TData> {
  let loaded: LoadedRouteMatch<TData> | null = null;
  const listeners = new Set<(loaded: LoadedRouteMatch<TData>) => void>();

  return {
    router,
    renderDepth,
    getLoaded: () => loaded,
    setLoaded: (nextLoaded) => {
      loaded = nextLoaded;
      for (const listener of listeners) {
        listener(nextLoaded);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

export function getLoadedBranch(loaded: LoadedRouteMatch<unknown>): LoadedRouteBranchEntry[] {
  return loaded.branch && loaded.branch.length > 0
    ? loaded.branch
    : [{
        match: loaded.match,
        module: loaded.module,
        component: loaded.component
      }];
}

function getBranchEntryKey(entry: LoadedRouteBranchEntry): string {
  return `${entry.match.route.id}:${entry.match.route.path}:${entry.match.pathname}`;
}

export function getLoadedRenderKey(loaded: LoadedRouteMatch<unknown>, depth: number): string | null {
  const entry = getLoadedBranch(loaded)[depth];
  return entry ? getBranchEntryKey(entry) : null;
}

export function getLeafRenderKey(loaded: LoadedRouteMatch<unknown>): string {
  return getBranchEntryKey({
    match: loaded.match,
    module: loaded.module,
    component: loaded.component
  });
}

export function withRouteOutletRenderContext<T>(
  context: RouteOutletRenderContext,
  render: () => T
): T {
  routeOutletStack.push(context);
  try {
    return render();
  } finally {
    routeOutletStack.pop();
  }
}

export function bindRouteOutletRenderContext(
  componentContext: ComponentContext,
  outletContext: RouteOutletRenderContext
): void {
  (componentContext as RouteOutletComponentContext)[ROUTE_OUTLET_CONTEXT] = outletContext;
}

function getRouteOutletRenderContext(): RouteOutletRenderContext | null {
  const stacked = routeOutletStack[routeOutletStack.length - 1];
  if (stacked) {
    return stacked;
  }

  return (getCurrentContext() as RouteOutletComponentContext | null)?.[ROUTE_OUTLET_CONTEXT] ?? null;
}

function clearOutletHost(root: HTMLElement): void {
  try {
    unmount(root);
  } catch {
    root.innerHTML = "";
  }
}

export function RouterView(): Node {
  const context = getRouteOutletRenderContext();
  if (!context) {
    throw new Error("RouterView must be rendered inside a routed branch managed by createRouteView().");
  }

  context.outletsUsed.add(context.depth);

  const host = document.createElement("div");
  host.setAttribute("data-tera-router-view", "true");

  const targetDepth = context.depth + 1;
  let renderedKey: string | null = null;

  const renderLoaded = (loaded: LoadedRouteMatch<unknown>) => {
    const entryKey = getLoadedRenderKey(loaded, targetDepth);
    if (!entryKey) {
      renderedKey = null;
      clearOutletHost(host);
      return;
    }

    if (entryKey === renderedKey) {
      return;
    }

    renderedKey = entryKey;
    clearOutletHost(host);
    host.appendChild(context.controller.renderDepth(loaded, targetDepth, context.outletsUsed));
  };

  const loaded = context.controller.getLoaded();
  if (loaded) {
    renderLoaded(loaded);
  }

  const unsubscribe = context.controller.subscribe(renderLoaded);
  onCleanup(unsubscribe);

  return host;
}
