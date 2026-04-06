import type { HydrationMode } from "@terajs/shared";
import type { MetaConfig, ParsedSFC } from "@terajs/sfc";

export interface RouteLayoutDefinition {
  /** Stable identifier for the layout entry. */
  id: string;
  /** File path of the layout component. */
  filePath: string;
  /** Lazy loader for the layout module. */
  component: () => Promise<unknown>;
}

/**
 * Fully-resolved route definition used by the router and runtime.
 */
export interface RouteDefinition {
  /** Stable identifier for this route. */
  id: string;
  /** Final path for this route, e.g. "/blog/:slug". */
  path: string;
  /** File path of the underlying SFC. */
  filePath: string;
  /** Lazy loader for the component module. */
  component: () => Promise<unknown>;
  /** Named layout to use, or null for default. */
  layout: string | null;
  /** Middleware names to run before entering this route. */
  middleware: string[];
  /** Whether this route should be prerendered at build time. */
  prerender: boolean;
  /** Hydration strategy for this route. */
  hydrate: HydrationMode;
  /** Whether this route should run on the edge runtime. */
  edge: boolean;
  /** Metadata configuration for SEO, AI, analytics, etc. */
  meta: MetaConfig;
  /** AI metadata, if present. This is opaque and passed through from the SFC. */
  ai?: Record<string, any>; 
  /** File-based layouts discovered for this route, ordered from outermost to innermost. */
  layouts: RouteLayoutDefinition[];
}

function normalizeFilePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function inferRouteId(filePath: string): string {
  const normalized = normalizeFilePath(filePath).replace(/\.nbl$/, "");
  const rootMatch = normalized.match(/^(.*\/)(pages|routes)\/(.*)$/);

  if (!rootMatch) {
    return normalized;
  }

  return rootMatch[3] || "index";
}

/**
 * Infers a route path from a file path inside the /pages directory.
 *
 * Examples:
 * - "/src/pages/index.nbl"         → "/"
 * - "/src/pages/about.nbl"         → "/about"
 * - "/src/pages/blog/[slug].nbl"  → "/blog/:slug"
 */
export function inferPathFromFile(filePath: string): string {
  const normalized = normalizeFilePath(filePath);
  const withoutPrefix = normalized.replace(/^.*\/(pages|routes)\//, "/");
  const withoutExt = withoutPrefix.replace(/\.nbl$/, "");
  const withParams = withoutExt.replace(/\[([^\]]+)\]/g, ":$1");
  
  // Handle the /index edge case for the root path
  const finalPath = withParams.endsWith("/index") 
    ? withParams.slice(0, -6) || "/" 
    : withParams;
    
  return finalPath;
}

/**
 * Builds a concrete RouteDefinition from a parsed SFC, applying
 * defaults and any overrides declared in the `<route>` block.
 *
 * @param sfc - Parsed SFC representation.
 */
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
    // Use Vite-friendly dynamic import for the SFC path
    component: () => import(/* @vite-ignore */ sfc.filePath),
    layout: o.layout ?? null,
    middleware,
    prerender: o.prerender ?? true,
    hydrate: o.hydrate ?? "eager",
    edge: o.edge ?? false,
    meta: sfc.meta,
    ai: sfc.ai,
    layouts: [],
  };
}