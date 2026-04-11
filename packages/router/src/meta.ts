import type { RouteDefinition, RouteMetaConfig } from "./definition.js";
import type { LoadedLayoutModule, LoadedRouteMatch } from "./loading.js";

export interface ResolvedRouteMetadata {
  meta: RouteMetaConfig;
  ai?: Record<string, unknown>;
  route: Pick<
    RouteDefinition,
    "id" | "path" | "filePath" | "layout" | "mountTarget" | "middleware" | "prerender" | "hydrate" | "edge"
  > & {
    layouts: string[];
  };
}

interface MetadataCarrier {
  meta?: unknown;
  ai?: unknown;
  route?: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeValues(base: unknown, incoming: unknown): unknown {
  if (incoming === undefined) {
    return base;
  }

  if (Array.isArray(base) && Array.isArray(incoming)) {
    return Array.from(new Set([...base, ...incoming]));
  }

  if (isPlainObject(base) && isPlainObject(incoming)) {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(incoming)) {
      merged[key] = mergeValues(merged[key], value);
    }
    return merged;
  }

  return incoming;
}

function mergeRecords<T extends object>(
  ...records: Array<T | undefined>
): T {
  let merged: Record<string, unknown> = {};

  for (const record of records) {
    if (!isPlainObject(record)) {
      continue;
    }

    merged = mergeValues(merged, record) as Record<string, unknown>;
  }

  return merged as T;
}

function readMetadataCarrier(value: unknown): MetadataCarrier {
  if ((typeof value !== "object" && typeof value !== "function") || value === null) {
    return {};
  }

  const carrier = value as MetadataCarrier;
  return {
    meta: isPlainObject(carrier.meta) ? carrier.meta : undefined,
    ai: isPlainObject(carrier.ai) ? carrier.ai : undefined,
    route: isPlainObject(carrier.route) ? carrier.route : undefined
  };
}

function buildResolvedRoute(loaded: LoadedRouteMatch<unknown>, carriers: MetadataCarrier[]) {
  const mergedRoute = mergeRecords<Record<string, unknown>>(
    ...carriers.map((carrier) => carrier.route as Record<string, unknown> | undefined)
  );

  mergedRoute.id = loaded.match.route.id;
  mergedRoute.path = loaded.match.route.path;
  mergedRoute.filePath = loaded.match.route.filePath;
  mergedRoute.mountTarget = loaded.match.route.mountTarget;
  mergedRoute.middleware = loaded.match.route.middleware;
  mergedRoute.prerender = loaded.match.route.prerender;
  mergedRoute.hydrate = loaded.match.route.hydrate;
  mergedRoute.edge = loaded.match.route.edge;
  mergedRoute.layouts = loaded.layouts.map((layout) => layout.definition.id);

  if (loaded.match.route.layout !== null && loaded.match.route.layout !== undefined) {
    mergedRoute.layout = loaded.match.route.layout;
  }

  return mergedRoute as ResolvedRouteMetadata["route"];
}

function metadataCarriersFromLayouts(layouts: LoadedLayoutModule[]): MetadataCarrier[] {
  return layouts.map((layout) => readMetadataCarrier(layout.component));
}

export function resolveLoadedRouteMetadata<TData = unknown>(
  loaded: LoadedRouteMatch<TData>
): ResolvedRouteMetadata {
  const layoutCarriers = metadataCarriersFromLayouts(loaded.layouts);
  const pageCarrier = readMetadataCarrier(loaded.component);

  const meta = mergeRecords<RouteMetaConfig>(
    ...layoutCarriers.map((carrier) => carrier.meta as RouteMetaConfig | undefined),
    loaded.match.route.meta as RouteMetaConfig,
    pageCarrier.meta as RouteMetaConfig | undefined
  );

  const ai = mergeRecords<Record<string, unknown>>(
    ...layoutCarriers.map((carrier) => carrier.ai as Record<string, unknown> | undefined),
    loaded.match.route.ai as Record<string, unknown> | undefined,
    pageCarrier.ai as Record<string, unknown> | undefined
  );

  return {
    meta,
    ai: Object.keys(ai).length > 0 ? ai : undefined,
    route: buildResolvedRoute(loaded as LoadedRouteMatch<unknown>, [...layoutCarriers, pageCarrier])
  };
}