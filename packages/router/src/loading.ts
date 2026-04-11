import { Debug } from "@terajs/shared";
import type { ServerContext } from "@terajs/shared";
import type { RouteDefinition } from "./definition.js";
import { resolveLoadedRouteMetadata, type ResolvedRouteMetadata } from "./meta.js";
import type { RouteMatch, Router } from "./runtime.js";

const prefetchedRouteMatches = new Map<string, Promise<LoadedRouteMatch<unknown>>>();

export interface RouteLoadContext {
  route: RouteDefinition;
  params: RouteMatch["params"];
  query: RouteMatch["query"];
  hash: string;
  pathname: string;
  fullPath: string;
  signal?: AbortSignal;
  server?: ServerContext;
}

export interface RouteModule<TComponent = unknown, TData = unknown> {
  default?: TComponent;
  load?: (context: RouteLoadContext) => Promise<TData> | TData;
}

export interface LoadedLayoutModule {
  definition: NonNullable<RouteDefinition["layouts"]>[number];
  module: unknown;
  component: unknown;
}

export interface LoadedRouteMatch<TData = unknown> {
  match: RouteMatch;
  module: unknown;
  component: unknown;
  layouts: LoadedLayoutModule[];
  resolved: ResolvedRouteMetadata;
  data?: TData;
}

export interface RouteHydrationSnapshot<TData = unknown> {
  to: string;
  params: RouteMatch["params"];
  query: RouteMatch["query"];
  hash: string;
  data?: TData;
  resolved: ResolvedRouteMetadata;
}

function hasDefaultExport(value: unknown): value is { default: unknown } {
  return typeof value === "object" && value !== null && "default" in value;
}

function hasLoadFunction<TData>(value: unknown): value is RouteModule<unknown, TData> {
  return typeof value === "object" && value !== null && "load" in value && typeof (value as RouteModule).load === "function";
}

/**
 * Loads a matched route module, its layouts, and optional route data.
 *
 * Hydration snapshots can be supplied to skip loader execution during
 * client boot.
 */
export async function loadRouteMatch<TData = unknown>(
  match: RouteMatch,
  options: {
    signal?: AbortSignal;
    hydrationSnapshot?: RouteHydrationSnapshot<TData>;
    serverContext?: ServerContext;
    preferPrefetched?: boolean;
  } = {}
): Promise<LoadedRouteMatch<TData>> {
  const hydrationSnapshot = options.hydrationSnapshot?.to === match.fullPath
    ? options.hydrationSnapshot
    : undefined;

  if (!hydrationSnapshot && options.preferPrefetched !== false) {
    const prefetched = prefetchedRouteMatches.get(match.fullPath);
    if (prefetched) {
      prefetchedRouteMatches.delete(match.fullPath);
      return prefetched as Promise<LoadedRouteMatch<TData>>;
    }
  }

  Debug.emit("route:load:start", {
    to: match.fullPath,
    route: match.route.path,
    params: match.params,
    query: match.query,
    hydrated: hydrationSnapshot !== undefined
  });

  const routeModule = await match.route.component();
  try {
    const layoutModules = await Promise.all(
      match.route.layouts.map(async (layoutDefinition) => {
        const layoutModule = await layoutDefinition.component();
        return {
          definition: layoutDefinition,
          module: layoutModule,
          component: hasDefaultExport(layoutModule) ? layoutModule.default : layoutModule
        } satisfies LoadedLayoutModule;
      })
    );

    let data: TData | undefined = hydrationSnapshot?.data;

    if (!hydrationSnapshot && hasLoadFunction<TData>(routeModule)) {
      const load = (
        routeModule as RouteModule<unknown, TData> & {
          load: NonNullable<RouteModule<unknown, TData>["load"]>;
        }
      ).load;

      data = await load({
        route: match.route,
        params: match.params,
        query: match.query,
        hash: match.hash,
        pathname: match.pathname,
        fullPath: match.fullPath,
        signal: options.signal,
        server: options.serverContext
      });
    }

    const loaded = {
      match,
      module: routeModule,
      component: hasDefaultExport(routeModule) ? routeModule.default : routeModule,
      layouts: layoutModules,
      resolved: hydrationSnapshot?.resolved ?? (undefined as unknown as ResolvedRouteMetadata),
      data
    };

    if (!hydrationSnapshot) {
      loaded.resolved = resolveLoadedRouteMetadata(loaded);
    }

    Debug.emit("route:load:end", {
      to: match.fullPath,
      route: match.route.path,
      layoutCount: layoutModules.length,
      hasData: data !== undefined,
      title: loaded.resolved.meta.title,
      hydrated: hydrationSnapshot !== undefined
    });
    Debug.emit("route:meta:resolved", {
      to: match.fullPath,
      meta: loaded.resolved.meta,
      ai: loaded.resolved.ai,
      route: loaded.resolved.route
    });

    return loaded;
  } catch (error) {
    Debug.emit("error:router", {
      message: error instanceof Error ? error.message : "Route load failed",
      to: match.fullPath,
      route: match.route.path,
      error
    });
    throw error;
  }
}

/**
 * Serializes loaded route data and metadata for hydration handoff.
 */
export function createRouteHydrationSnapshot<TData = unknown>(
  loaded: LoadedRouteMatch<TData>
): RouteHydrationSnapshot<TData> {
  return {
    to: loaded.match.fullPath,
    params: loaded.match.params,
    query: loaded.match.query,
    hash: loaded.match.hash,
    data: loaded.data,
    resolved: loaded.resolved
  };
}

/**
 * Prefetches a route match and caches the pending result by full path.
 */
export function prefetchRouteMatch<TData = unknown>(
  match: RouteMatch
): Promise<LoadedRouteMatch<TData>> {
  const existing = prefetchedRouteMatches.get(match.fullPath);
  if (existing) {
    return existing as Promise<LoadedRouteMatch<TData>>;
  }

  const pending = loadRouteMatch<TData>(match, {
    preferPrefetched: false
  }).catch((error) => {
    prefetchedRouteMatches.delete(match.fullPath);
    throw error;
  });

  prefetchedRouteMatches.set(match.fullPath, pending as Promise<LoadedRouteMatch<unknown>>);
  return pending;
}

/**
 * Clears one cached prefetched route, or all cached prefetched routes.
 */
export function clearPrefetchedRouteMatches(target?: string): void {
  if (target) {
    prefetchedRouteMatches.delete(target);
    return;
  }

  prefetchedRouteMatches.clear();
}

/**
 * Resolves and prefetches a route by URL target.
 *
 * Returns null when the target cannot be matched.
 */
export async function prefetchRoute<TData = unknown>(
  router: Router,
  target: string
): Promise<LoadedRouteMatch<TData> | null> {
  const match = router.resolve(target);
  if (!match) {
    return null;
  }

  return prefetchRouteMatch<TData>(match);
}