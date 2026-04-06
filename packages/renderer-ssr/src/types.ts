/**
 * @file types.ts
 * @description
 * Shared SSR types for Nebula's server-side renderer.
 * These types define the shape of the SSR context, hydration hints,
 * and the final SSR output returned by `renderToString`.
 */

import type { RouteHydrationSnapshot } from "@terajs/router";

/**
 * Context object passed into SSR.
 *
 * This allows callers (framework, router, tests) to override or extend
 * metadata and route configuration at render time.
 */
export interface SSRContext {
  /** Additional or overriding meta fields. */
  meta?: Record<string, any>;

  /** Additional or overriding route fields. */
  route?: Record<string, any>;
  
  /** AI metadata, if present. This is opaque and passed through from the SFC. */
  ai?: Record<string, any>;

  /** Serialized route payload used to resume route state on the client. */
  routeSnapshot?: RouteHydrationSnapshot<unknown>;
}

/**
 * Hydration hint derived from meta, route, or SSR context.
 *
 * Nebula uses hydration modes to determine how the client should
 * re-activate the server-rendered HTML.
 */
export interface SSRHydrationHint {
  /**
   * Hydration mode:
   * - eager: hydrate immediately
   * - visible: hydrate when visible
   * - idle: hydrate when browser is idle
   * - interaction: hydrate on user interaction
   * - none: do not hydrate
   * - ai: hydrate based on AI-driven heuristics
   */
  mode: "eager" | "visible" | "idle" | "interaction" | "none" | "ai";
}

/**
 * Result of Nebula's server-side rendering.
 *
 * Returned by `renderToString`, this object contains:
 * - the rendered HTML body
 * - the rendered <head> content
 * - hydration metadata for the client
 */
export interface SSRResult {
  /** Rendered HTML including hydration marker. */
  html: string;

  /** Rendered <head> content (title, meta tags, etc.). */
  head: string;

  /** Hydration hint for the client renderer. */
  hydration: SSRHydrationHint;

  /** AI metadata, if present. This is opaque and passed through from the SFC. */
  ai?: Record<string, any>;

  /** Serialized route payload used to resume route state on the client. */
  routeSnapshot?: RouteHydrationSnapshot<unknown>;
}
