import type { LoadedRouteMatch, RouteHydrationSnapshot, RouteMatch, Router } from "@terajs/router";
import { getRouteDataResourceKeys, loadRouteMatch } from "@terajs/router";
import { onCleanup, registerResourceInvalidation } from "@terajs/runtime";
import { Debug } from "@terajs/shared";
import { withErrorBoundary } from "./errorBoundary.js";
import { readHydrationPayload } from "./hydrate.js";
import { mount, unmount } from "./mount.js";
import type { FrameworkComponent } from "./render.js";
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
  if (typeof document === "undefined") {
    return;
  }

  const { meta } = loaded.resolved;

  if (typeof meta.title === "string") {
    document.title = meta.title;
  }

  syncMetaTag("description", typeof meta.description === "string" ? meta.description : undefined);
  syncMetaTag(
    "keywords",
    Array.isArray(meta.keywords) ? meta.keywords.join(", ") : typeof meta.keywords === "string" ? meta.keywords : undefined
  );
}

function syncMetaTag(name: string, content: string | undefined): void {
  if (typeof document === "undefined") {
    return;
  }

  let tag = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!content) {
    tag?.remove();
    return;
  }

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function composeLoadedMatch<TData>(
  router: Router,
  loaded: LoadedRouteMatch<TData>
): FrameworkComponent {
  const pageComponent = resolveFrameworkComponent(loaded.component, loaded.match.route.filePath);

  let current: FrameworkComponent = () =>
    pageComponent({
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
      layoutComponent({
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

        renderPendingNode(null);

        Debug.emit("error:router", {
          message: error instanceof Error ? error.message : "Failed to render route.",
          to: lastTarget,
          error
        });

        renderContentNode(
          options.error?.({ router, target: lastTarget, error, retry }) ??
            createTextNode(`Route render failed: ${lastTarget}`)
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