/**
 * @file types.ts
 * @description
 * Shared SSR types for Terajs's server-side renderer.
 * These types define the shape of the SSR context, hydration hints,
 * and the final SSR output returned by `renderToString`.
 */

import type { RouteHydrationSnapshot } from "@terajs/router";
import type { ResourcePayload } from "@terajs/runtime";

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

  /** Whether the current render includes async resources. */
  hasAsyncResource?: boolean;
  
  /** AI metadata, if present. This is opaque and passed through from the SFC. */
  ai?: Record<string, any>;

  /** Data scope used to evaluate dynamic IR on the server. */
  scope?: Record<string, unknown>;

  /** Serialized assets for build manifest preloading. */
  assets?: string[];

  /** Serialized resources reused by client-side createResource hydration. */
  resources?: Record<string, unknown>;

  /** Serialized route payload used to resume route state on the client. */
  routeSnapshot?: RouteHydrationSnapshot<unknown>;

  /** Serialized hydration payloads for keyed resources. */
  data?: Record<string, unknown>;
}

/**
 * Hydration hint derived from meta, route, or SSR context.
 *
 * Terajs uses hydration modes to determine how the client should
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
 * Result of Terajs's server-side rendering.
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

  /** Serialized resources reused by client-side createResource hydration. */
  resources?: Record<string, unknown>;

  /** Serialized route payload used to resume route state on the client. */
  routeSnapshot?: RouteHydrationSnapshot<unknown>;

  /** Serialized loader data for client hydration. */
  data?: Record<string, any>;
}
