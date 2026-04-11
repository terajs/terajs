import type { ParsedSFC } from "@terajs/sfc";
import type { RouteDefinition } from "@terajs/router";

function normalizeFilePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function inferRouteId(filePath: string): string {
  const normalized = normalizeFilePath(filePath).replace(/\.tera$/, "");
  const rootMatch = normalized.match(/^(.*\/)(pages|routes)\/(.*)$/);

  if (!rootMatch) {
    return normalized;
  }

  return rootMatch[3] || "index";
}

export function inferPathFromFile(filePath: string): string {
  const normalized = normalizeFilePath(filePath);
  const withoutPrefix = normalized.replace(/^.*\/(pages|routes)\//, "/");
  const withoutExt = withoutPrefix.replace(/\.tera$/, "");
  const withParams = withoutExt.replace(/\[([^\]]+)\]/g, ":$1");
  const finalPath = withParams.endsWith("/index")
    ? withParams.slice(0, -6) || "/"
    : withParams;

  return finalPath;
}

export function buildRouteFromSFC(sfc: ParsedSFC): RouteDefinition {
  const basePath = inferPathFromFile(sfc.filePath);
  const o = sfc.routeOverride ?? {};

  const middleware = Array.isArray(o.middleware)
    ? o.middleware
    : o.middleware
    ? [o.middleware]
    : [];

  return {
    id: inferRouteId(sfc.filePath),
    path: o.path ?? basePath,
    filePath: sfc.filePath,
    component: () => import(/* @vite-ignore */ sfc.filePath),
    layout: o.layout ?? null,
    mountTarget: o.mountTarget,
    middleware,
    prerender: o.prerender ?? true,
    hydrate: o.hydrate ?? "eager",
    edge: o.edge ?? false,
    meta: sfc.meta,
    ai: sfc.ai,
    layouts: []
  };
}