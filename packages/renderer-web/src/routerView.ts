import type { LoadedRouteMatch, RouteHydrationSnapshot, RouteMatch, Router } from "@terajs/router";
import { getRouteDataResourceKeys, loadRouteMatch } from "@terajs/router";
import { onCleanup, registerResourceInvalidation } from "@terajs/runtime";
import { emitRendererDebug } from "./debug.js";
import { addNodeCleanup } from "./dom.js";
import { updateHead } from "./clientMeta.js";
import { withErrorBoundary } from "./errorBoundary.js";
import { readHydrationPayload } from "./hydrate.js";
import { mount, unmount } from "./mount.js";
import { renderComponent, type FrameworkComponent } from "./render.js";
import {
  bindRouteOutletRenderContext,
  createRouteOutletController,
  getLeafRenderKey,
  getLoadedBranch,
  getLoadedRenderKey,
  type RouteOutletController,
  type RouteOutletRenderContext,
  withRouteOutletRenderContext
} from "./routeOutlet.js";
import { withRouterContext } from "./routerContext.js";

export interface RouteRenderContext<TData = unknown> {
  router: Router;
  match: RouteMatch;
  loaded: LoadedRouteMatch<TData>;
}

export interface RouteViewOptions<TData = unknown> {
  autoStart?: boolean;
  loading?: (context: { router: Router; match: RouteMatch }) => Node;
  pending?: (context: {
    router: Router;
    current: RouteMatch | null;
    match: RouteMatch;
  }) => Node;
  keepPreviousDuringLoading?: boolean;
  notFound?: (context: { router: Router; target: string }) => Node;
  error?: (context: { router: Router; target: string; error: unknown; retry: () => Promise<void> }) => Node;
  componentError?: (context: {
    router: Router;
    match: RouteMatch;
    loaded: LoadedRouteMatch<TData>;
    error: unknown;
    retry: () => void;
  }) => Node;
  applyMeta?: boolean;
  hydrationSnapshot?: RouteHydrationSnapshot<TData>;
}

function createTextNode(message: string): Node {
  return document.createTextNode(message);
}

function resolveFrameworkComponent(value: unknown, label: string): FrameworkComponent {
  if (typeof value !== "function") {
    throw new Error(`${label} did not resolve to a component function.`);
  }

  return value as FrameworkComponent;
}

function applyResolvedRouteMetadata(loaded: LoadedRouteMatch<unknown>): void {
  updateHead(loaded.resolved.meta, loaded.resolved.ai, loaded.match.pathname);
}

type RouteRenderMode = "leaf" | "nested";

function composeLoadedMatch<TData>(
  router: Router,
  loaded: LoadedRouteMatch<TData>
): FrameworkComponent {
  const pageComponent = resolveFrameworkComponent(loaded.component, loaded.match.route.filePath);

  let current: FrameworkComponent = () =>
    renderRouteComponent(pageComponent, {
      router,
      route: loaded.match,
      params: loaded.match.params,
      query: loaded.match.query,
      hash: loaded.match.hash,
      data: loaded.data
    });

  for (let index = loaded.layouts.length - 1; index >= 0; index -= 1) {
    const layout = loaded.layouts[index];
    const layoutComponent = resolveFrameworkComponent(layout.component, layout.definition.filePath);
    const child = current;

    current = () =>
      renderRouteComponent(layoutComponent, {
        router,
        route: loaded.match,
        params: loaded.match.params,
        query: loaded.match.query,
        hash: loaded.match.hash,
        data: loaded.data,
        children: child()
      });
  }

  return current;
}

function composeLoadedBranchRoot<TData>(
  router: Router,
  loaded: LoadedRouteMatch<TData>,
  controller: RouteOutletController<TData>,
  outletsUsed: Set<number>
): FrameworkComponent {
  const rootEntry = getLoadedBranch(loaded)[0];

  let current: FrameworkComponent = () =>
    renderLoadedBranchComponent(router, loaded, 0, controller, outletsUsed);

  for (let index = loaded.layouts.length - 1; index >= 0; index -= 1) {
    const layout = loaded.layouts[index];
    const layoutComponent = resolveFrameworkComponent(layout.component, layout.definition.filePath);
    const child = current;

    current = () =>
      renderRouteComponent(layoutComponent, {
        router,
        route: rootEntry.match,
        params: rootEntry.match.params,
        query: rootEntry.match.query,
        hash: rootEntry.match.hash,
        data: undefined,
        children: child()
      });
  }

  return current;
}

function renderLoadedBranchComponent<TData>(
  router: Router,
  loaded: LoadedRouteMatch<TData>,
  depth: number,
  controller: RouteOutletController<TData>,
  outletsUsed: Set<number>
): Node {
  const branch = getLoadedBranch(loaded);
  const entry = branch[depth];
  if (!entry) {
    return document.createTextNode("");
  }

  const component = resolveFrameworkComponent(entry.component, entry.match.route.filePath);
  const outletContext = { controller, depth, outletsUsed };
  return withRouteOutletRenderContext(outletContext, () =>
    renderRouteComponent(component, {
      router,
      route: entry.match,
      params: entry.match.params,
      query: entry.match.query,
      hash: entry.match.hash,
      data: depth === branch.length - 1 ? loaded.data : undefined
    }, outletContext)
  );
}

function renderRouteComponent(
  component: FrameworkComponent,
  props: Record<string, unknown>,
  outletContext?: RouteOutletRenderContext
): Node {
  const rendered = renderComponent(component, props);
  if (outletContext) {
    bindRouteOutletRenderContext(rendered.ctx, outletContext);
  }

  rendered.ctx.route = {
    router: props.router,
    route: props.route,
    params: props.params,
    query: props.query,
    hash: props.hash,
    data: props.data
  };
  const cleanup = createRouteComponentCleanup(rendered.ctx);

  queueMicrotask(() => {
    if (!cleanup.active()) {
      return;
    }

    runRouteMountedHooks(rendered.ctx);
  });

  attachRouteComponentCleanup(rendered.node, cleanup.dispose);

  return normalizeRouteComponentNode(rendered.node);
}

function runRouteMountedHooks(ctx: any): void {
  if (!ctx?.mounted) {
    return;
  }

  for (const fn of ctx.mounted) {
    try {
      fn();
    } catch (error) {
      emitRendererDebug("error:component", () => ({
        name: ctx.name,
        instance: ctx.instance,
        error
      }));
    }
  }
}

function createRouteComponentCleanup(ctx: any): { active: () => boolean; dispose: () => void } {
  let disposed = false;

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;

    if (ctx?.unmounted) {
      for (const fn of ctx.unmounted) {
        try {
          fn();
        } catch (error) {
          emitRendererDebug("error:component", () => ({
            name: ctx.name,
            instance: ctx.instance,
            error
          }));
        }
      }
    }

    if (ctx?.disposers) {
      for (const cleanup of ctx.disposers) {
        try {
          cleanup();
        } catch {
          // user cleanup errors are non-fatal during teardown
        }
      }

      ctx.disposers.length = 0;
    }
  };

  return {
    active: () => !disposed,
    dispose
  };
}

function attachRouteComponentCleanup(node: Node, cleanup: () => void): void {
  if (node instanceof DocumentFragment) {
    for (const child of Array.from(node.childNodes)) {
      addNodeCleanup(child, cleanup);
    }

    return;
  }

  addNodeCleanup(node, cleanup);
}

function normalizeRouteComponentNode(node: Node): Node {
  if (node instanceof DocumentFragment && node.childNodes.length === 1) {
    return node.firstChild as Node;
  }

  return node;
}

function maybeWrapLoadedMatch<TData>(
  router: Router,
  loaded: LoadedRouteMatch<TData>,
  options: RouteViewOptions<TData>
): FrameworkComponent {
  const composed = composeLoadedMatch(router, loaded);
  const routed: FrameworkComponent = () => withRouterContext(router, () => composed());

  if (!options.componentError) {
    return routed;
  }

  return withErrorBoundary(routed, {
    fallback: ({ error, retry }) => options.componentError!({
      router,
      match: loaded.match,
      loaded,
      error,
      retry
    })
  });
}

function maybeWrapLoadedBranchRoot<TData>(
  router: Router,
  loaded: LoadedRouteMatch<TData>,
  options: RouteViewOptions<TData>,
  controller: RouteOutletController<TData>,
  outletsUsed: Set<number>
): FrameworkComponent {
  const composed = composeLoadedBranchRoot(router, loaded, controller, outletsUsed);
  const routed: FrameworkComponent = () => withRouterContext(router, () => composed());

  if (!options.componentError) {
    return routed;
  }

  return withErrorBoundary(routed, {
    fallback: ({ error, retry }) => options.componentError!({
      router,
      match: loaded.match,
      loaded,
      error,
      retry
    })
  });
}

export function createRouteView<TData = unknown>(
  router: Router,
  options: RouteViewOptions<TData> = {}
): FrameworkComponent {
  return () => {
    const host = document.createElement("div");
    host.setAttribute("data-tera-route-view", "true");
    const contentHost = document.createElement("div");
    contentHost.setAttribute("data-tera-route-content", "true");
    const pendingHost = document.createElement("div");
    pendingHost.setAttribute("data-tera-route-pending", "true");
    host.append(contentHost, pendingHost);

    let navigationToken = 0;
    let started = false;
    let lastTarget = router.history.getLocation();
    let currentAbort: AbortController | null = null;
    let currentRouteInvalidationCleanup: (() => void) | null = null;
    let lastRenderedMatch: RouteMatch | null = router.getCurrentRoute();
    let activeRenderKey: string | null = null;
    let activeRenderMode: RouteRenderMode | null = null;
    let outletController!: RouteOutletController<TData>;
    outletController = createRouteOutletController<TData>(
      router,
      (loaded, depth, outletsUsed) =>
        renderLoadedBranchComponent(router, loaded, depth, outletController, outletsUsed)
    );
    let hydrationSnapshot = options.hydrationSnapshot ?? readHydrationPayload().routeSnapshot as RouteHydrationSnapshot<TData> | undefined;

    const clearRoot = (root: HTMLElement) => {
      try {
        unmount(root);
      } catch {
        root.innerHTML = "";
      }
    };

    const renderContentNode = (node: Node) => {
      clearRoot(contentHost);
      contentHost.appendChild(node);
    };

    const renderPendingNode = (node: Node | null) => {
      clearRoot(pendingHost);
      if (node) {
        pendingHost.appendChild(node);
      }
    };

    const renderMatch = async (match: RouteMatch | null) => {
      const previousMatch = lastRenderedMatch;
      navigationToken += 1;
      const token = navigationToken;
      currentAbort?.abort();
      currentAbort = new AbortController();
      currentRouteInvalidationCleanup?.();
      currentRouteInvalidationCleanup = null;

      if (!match) {
        renderPendingNode(null);
        renderContentNode(
          options.notFound?.({ router, target: lastTarget }) ??
            createTextNode(`Route not found: ${lastTarget}`)
        );
        lastRenderedMatch = null;
        return;
      }

      lastTarget = match.fullPath;

      const retry = async () => {
        const activeMatch = router.getCurrentRoute() ?? match;
        await renderMatch(activeMatch);
      };

      if (options.keepPreviousDuringLoading && contentHost.childNodes.length > 0) {
        renderPendingNode(
          options.pending?.({ router, current: previousMatch, match }) ??
            options.loading?.({ router, match }) ??
            null
        );
      } else if (options.loading) {
        renderPendingNode(null);
        renderContentNode(options.loading({ router, match }));
      }

      try {
        const loaded = await loadRouteMatch<TData>(match, {
          signal: currentAbort.signal,
          hydrationSnapshot
        });

        if (hydrationSnapshot?.to === match.fullPath) {
          hydrationSnapshot = undefined;
        }

        if (token !== navigationToken || currentAbort.signal.aborted) {
          return;
        }

        if (options.applyMeta !== false) {
          applyResolvedRouteMetadata(loaded);
        }

        renderPendingNode(null);

        currentRouteInvalidationCleanup = registerResourceInvalidation(
          getRouteDataResourceKeys(match.route.id),
          async () => {
            const activeMatch = router.getCurrentRoute();
            if (!activeMatch || activeMatch.fullPath !== match.fullPath) {
              return;
            }

            await renderMatch(activeMatch);
          }
        );

        const nestedRootKey = getLoadedBranch(loaded).length > 1
          ? getLoadedRenderKey(loaded, 0)
          : null;

        if (nestedRootKey && activeRenderMode === "nested" && activeRenderKey === nestedRootKey) {
          outletController.setLoaded(loaded);
          lastRenderedMatch = loaded.match;
          return;
        }

        if (!nestedRootKey) {
          outletController.setLoaded(loaded);
          activeRenderMode = "leaf";
          activeRenderKey = getLeafRenderKey(loaded);
          mount(maybeWrapLoadedMatch(router, loaded, options), contentHost);
          lastRenderedMatch = loaded.match;
          return;
        }

        const outletsUsed = new Set<number>();
        if (activeRenderMode === "nested") {
          clearRoot(contentHost);
        }

        outletController.setLoaded(loaded);
        mount(
          maybeWrapLoadedBranchRoot(router, loaded, options, outletController, outletsUsed),
          contentHost
        );

        if (!outletsUsed.has(0)) {
          clearRoot(contentHost);
          activeRenderMode = "leaf";
          activeRenderKey = getLeafRenderKey(loaded);
          mount(maybeWrapLoadedMatch(router, loaded, options), contentHost);
          lastRenderedMatch = loaded.match;
          return;
        }

        activeRenderMode = "nested";
        activeRenderKey = nestedRootKey;
        lastRenderedMatch = loaded.match;
      } catch (error) {
        if (currentAbort.signal.aborted) {
          return;
        }

        const errorMessage = error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Unknown route render error.";

        renderPendingNode(null);

        if (typeof console !== "undefined" && typeof console.error === "function") {
          console.error(`[terajs/router] Route render failed for ${lastTarget}`, error);
        }

        emitRendererDebug("error:router", () => ({
          message: errorMessage,
          to: lastTarget,
          error
        }));

        renderContentNode(
          options.error?.({ router, target: lastTarget, error, retry }) ??
            createTextNode(`Route render failed: ${lastTarget} (${errorMessage})`)
        );
      }
    };

    const unsubscribe = router.subscribe((match) => {
      void renderMatch(match);
    });

    if (options.autoStart !== false && !started) {
      started = true;
      void router.start().then((result) => {
        if (result.type === "not-found") {
          lastTarget = result.to;
          void renderMatch(null);
        }
      });
    } else if (router.getCurrentRoute()) {
      void renderMatch(router.getCurrentRoute());
    }

    onCleanup(() => {
      currentAbort?.abort();
      currentRouteInvalidationCleanup?.();
      unsubscribe();
      activeRenderKey = null;
      activeRenderMode = null;
      clearRoot(contentHost);
      clearRoot(pendingHost);
      host.innerHTML = "";
    });

    return host;
  };
}
