import type { LoadedRouteMatch, RouteHydrationSnapshot, RouteMatch, Router } from "@terajs/router";
import { getRouteDataResourceKeys, loadRouteMatch } from "@terajs/router";
import { onCleanup, registerResourceInvalidation } from "@terajs/runtime";
import { Debug } from "@terajs/shared";
import { addNodeCleanup } from "./dom.js";
import { updateHead } from "./clientMeta.js";
import { withErrorBoundary } from "./errorBoundary.js";
import { readHydrationPayload } from "./hydrate.js";
import { mount, unmount } from "./mount.js";
import { renderComponent, type FrameworkComponent } from "./render.js";
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
  updateHead(loaded.resolved.meta, loaded.resolved.ai);
}

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

function renderRouteComponent(component: FrameworkComponent, props: Record<string, unknown>): Node {
  const rendered = renderComponent(component, props);
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
      Debug.emit("error:component", {
        name: ctx.name,
        instance: ctx.instance,
        error
      });
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
          Debug.emit("error:component", {
            name: ctx.name,
            instance: ctx.instance,
            error
          });
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

        mount(maybeWrapLoadedMatch(router, loaded, options), contentHost);
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

        Debug.emit("error:router", {
          message: errorMessage,
          to: lastTarget,
          error
        });

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
      clearRoot(contentHost);
      clearRoot(pendingHost);
      host.innerHTML = "";
    });

    return host;
  };
}