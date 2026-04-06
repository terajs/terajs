import { Debug } from "@terajs/shared";
import type { RouteDefinition } from "./builder";
import type { RouteMatch } from "./runtime";

export interface RouteLoadContext {
  route: RouteDefinition;
  params: RouteMatch["params"];
  query: RouteMatch["query"];
  hash: string;
  pathname: string;
  fullPath: string;
  signal?: AbortSignal;
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
  data?: TData;
}

function hasDefaultExport(value: unknown): value is { default: unknown } {
  return typeof value === "object" && value !== null && "default" in value;
}

function hasLoadFunction<TData>(value: unknown): value is RouteModule<unknown, TData> {
  return typeof value === "object" && value !== null && "load" in value && typeof (value as RouteModule).load === "function";
}

export async function loadRouteMatch<TData = unknown>(
  match: RouteMatch,
  options: { signal?: AbortSignal } = {}
): Promise<LoadedRouteMatch<TData>> {
  Debug.emit("route:load:start", {
    to: match.fullPath,
    route: match.route.path,
    params: match.params,
    query: match.query
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

    let data: TData | undefined;

    if (hasLoadFunction<TData>(routeModule)) {
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
        signal: options.signal
      });
    }

    const loaded = {
      match,
      module: routeModule,
      component: hasDefaultExport(routeModule) ? routeModule.default : routeModule,
      layouts: layoutModules,
      data
    };

    Debug.emit("route:load:end", {
      to: match.fullPath,
      route: match.route.path,
      layoutCount: layoutModules.length,
      hasData: data !== undefined
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