import type { LoadedRouteMatch, RouteHydrationSnapshot, RouteMatch, Router } from "@terajs/router";
import { loadRouteMatch } from "@terajs/router";
import { onCleanup } from "@terajs/runtime";
import { Debug } from "@terajs/shared";
import { readHydrationPayload } from "./hydrate";
import { mount, unmount } from "./mount";
import type { FrameworkComponent } from "./render";

export interface RouteRenderContext<TData = unknown> {
  router: Router;
  match: RouteMatch;
  loaded: LoadedRouteMatch<TData>;
}

export interface RouteViewOptions<TData = unknown> {
  autoStart?: boolean;
  loading?: (context: { router: Router; match: RouteMatch }) => Node;
  notFound?: (context: { router: Router; target: string }) => Node;
  error?: (context: { router: Router; target: string; error: unknown }) => Node;
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

export function createRouteView<TData = unknown>(
  router: Router,
  options: RouteViewOptions<TData> = {}
): FrameworkComponent {
  return () => {
    const host = document.createElement("div");
    host.setAttribute("data-tera-route-view", "true");

    let navigationToken = 0;
    let started = false;
    let lastTarget = router.history.getLocation();
    let currentAbort: AbortController | null = null;
    let hydrationSnapshot = options.hydrationSnapshot ?? readHydrationPayload().routeSnapshot as RouteHydrationSnapshot<TData> | undefined;

    const renderNode = (node: Node) => {
      try {
        unmount(host);
      } catch {
        host.innerHTML = "";
      }
      host.innerHTML = "";
      host.appendChild(node);
    };

    const renderMatch = async (match: RouteMatch | null) => {
      navigationToken += 1;
      const token = navigationToken;
      currentAbort?.abort();
      currentAbort = new AbortController();

      if (!match) {
        renderNode(
          options.notFound?.({ router, target: lastTarget }) ??
            createTextNode(`Route not found: ${lastTarget}`)
        );
        return;
      }

      lastTarget = match.fullPath;

      if (options.loading) {
        renderNode(options.loading({ router, match }));
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

        mount(composeLoadedMatch(router, loaded), host);
      } catch (error) {
        if (currentAbort.signal.aborted) {
          return;
        }

        Debug.emit("error:router", {
          message: error instanceof Error ? error.message : "Failed to render route.",
          to: lastTarget,
          error
        });

        renderNode(
          options.error?.({ router, target: lastTarget, error }) ??
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
      unsubscribe();
      try {
        unmount(host);
      } catch {
        host.innerHTML = "";
      }
    });

    return host;
  };
}