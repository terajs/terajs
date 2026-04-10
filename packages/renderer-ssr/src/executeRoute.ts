import type { IRModule } from "@terajs/compiler";
import type { ServerContext } from "@terajs/shared";
import {
  createMemoryHistory,
  createRouteHydrationSnapshot,
  createRouter,
  getRouteDataResourceKey,
  loadRouteMatch,
  ROUTE_DATA_RESOURCE_KEY,
  type LoadedRouteMatch,
  type NavigationGuard,
  type RouteDefinition,
  type RouteHydrationSnapshot,
  type RouteMatch
} from "@terajs/router";
import {
  createSSRHtml,
  renderBodyToString,
  renderHead,
  renderHydrationMarker,
  resolveHydration,
  type SSRHtml
} from "./renderToString.js";
import type { SSRContext, SSRResult } from "./types.js";

export interface SSRRouteModule<TData = unknown> {
  default?: unknown;
  load?: (context: unknown) => Promise<TData> | TData;
  setup?: (context: Record<string, unknown>) => Record<string, unknown>;
  ir?: IRModule;
}

export interface ExecuteServerRouteOptions<TData = unknown> {
  middleware?: Record<string, NavigationGuard>;
  props?: Record<string, unknown>;
  serverContext?: ServerContext;
  ssrContext?: Partial<SSRContext>;
}

export type ExecuteServerRouteResult<TData = unknown> =
  | {
      type: "success";
      match: RouteMatch;
      loaded: LoadedRouteMatch<TData>;
      snapshot: RouteHydrationSnapshot<TData>;
      ssr: SSRResult;
    }
  | {
      type: "blocked" | "not-found";
      to: string;
    }
  | {
      type: "redirect";
      to: string;
      redirectedTo: RouteMatch;
    };

function createFallbackIR(match: RouteMatch, loaded: LoadedRouteMatch<unknown>): IRModule {
  return {
    filePath: match.route.filePath,
    template: [],
    meta: loaded.resolved.meta,
    ai: loaded.resolved.ai,
    route: {
      path: loaded.resolved.route.path,
      layout: loaded.resolved.route.layout ?? undefined,
      middleware: loaded.resolved.route.middleware,
      prerender: loaded.resolved.route.prerender,
      hydrate: loaded.resolved.route.hydrate,
      edge: loaded.resolved.route.edge
    }
  };
}

function createSSRScope<TData>(
  loaded: LoadedRouteMatch<TData>,
  options: ExecuteServerRouteOptions<TData>,
  module: SSRRouteModule<TData>,
  extraScope: Record<string, unknown> = {}
): Record<string, unknown> {
  const baseContext = {
    props: options.props ?? {},
    route: loaded.match,
    params: loaded.match.params,
    query: loaded.match.query,
    hash: loaded.match.hash,
    data: loaded.data,
    server: options.serverContext
  };

  const setupContext = typeof module.setup === "function"
    ? module.setup(baseContext)
    : {};

  return {
    ...baseContext,
    ...setupContext,
    ...extraScope
  };
}

function getRenderableIR(
  module: SSRRouteModule<unknown>,
  fallback: IRModule | null
): IRModule {
  return module.ir ?? fallback ?? { filePath: "", template: [], meta: {}, route: null };
}

function buildSSRResources<TData>(
  loaded: LoadedRouteMatch<TData>,
  resources?: Record<string, unknown>
): Record<string, unknown> | undefined {
  const merged = {
    ...(resources ?? {})
  };

  if (loaded.data !== undefined) {
    merged[ROUTE_DATA_RESOURCE_KEY] = loaded.data;
    merged[getRouteDataResourceKey(loaded.match.route.id)] = loaded.data;
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function renderLoadedRouteBody<TData>(
  loaded: LoadedRouteMatch<TData>,
  options: ExecuteServerRouteOptions<TData>,
  pageModule: SSRRouteModule<TData>
): string {
  let currentHtml = renderBodyToString(
    getRenderableIR(pageModule, createFallbackIR(loaded.match, loaded as LoadedRouteMatch<unknown>)),
    {
      scope: createSSRScope(loaded, options, pageModule)
    }
  );

  for (let index = loaded.layouts.length - 1; index >= 0; index -= 1) {
    const layout = loaded.layouts[index];
    const layoutModule = layout.module as SSRRouteModule<TData>;
    if (!layoutModule.ir) {
      continue;
    }

    currentHtml = renderBodyToString(layoutModule.ir, {
      scope: createSSRScope(loaded, options, layoutModule, {
        children: createSSRHtml(currentHtml) as SSRHtml
      })
    });
  }

  return currentHtml;
}

export async function executeServerRoute<TData = unknown>(
  routes: RouteDefinition[],
  target: string,
  options: ExecuteServerRouteOptions<TData> = {}
): Promise<ExecuteServerRouteResult<TData>> {
  const router = createRouter(routes, {
    history: createMemoryHistory(target),
    middleware: options.middleware
  });
  const navigation = await router.start();

  if (navigation.type === "blocked" || navigation.type === "not-found") {
    return navigation;
  }

  if (navigation.type === "redirect") {
    return navigation;
  }

  const loaded = await loadRouteMatch<TData>(navigation.match, {
    serverContext: options.serverContext
  });
  const snapshot = createRouteHydrationSnapshot(loaded);
  const routeModule = loaded.module as SSRRouteModule<TData>;
  const routeIR = getRenderableIR(routeModule, createFallbackIR(loaded.match, loaded as LoadedRouteMatch<unknown>));
  const resources = buildSSRResources(loaded, options.ssrContext?.resources);
  const body = renderLoadedRouteBody(loaded, options, routeModule);
  const hydration = resolveHydration(routeIR, {
    ...options.ssrContext,
    meta: {
      ...loaded.resolved.meta,
      ...(options.ssrContext?.meta ?? {})
    },
    route: {
      ...loaded.resolved.route,
      ...(options.ssrContext?.route ?? {})
    }
  });
  const head = renderHead(routeIR, {
    ...options.ssrContext,
    meta: {
      ...loaded.resolved.meta,
      ...(options.ssrContext?.meta ?? {})
    }
  });
  const marker = renderHydrationMarker(hydration, {
    ai: {
      ...(loaded.resolved.ai ?? {}),
      ...(options.ssrContext?.ai ?? {})
    },
    resources,
    routeSnapshot: snapshot
  });

  const ssr: SSRResult = {
    html: body + marker,
    head,
    hydration,
    ai: {
      ...(loaded.resolved.ai ?? {}),
      ...(options.ssrContext?.ai ?? {})
    },
    resources,
    routeSnapshot: snapshot
  };

  return {
    type: "success",
    match: navigation.match,
    loaded,
    snapshot,
    ssr
  };
}