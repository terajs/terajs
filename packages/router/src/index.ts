/**
 * @file index.ts
 * @description
 * Entry point for the @terajs/router package.
 */

export {
  clearPrefetchedRouteMatches,
  createRouteHydrationSnapshot,
  loadRouteMatch,
  prefetchRoute,
  prefetchRouteMatch
} from "./loading.js";
export { resolveLoadedRouteMetadata } from "./meta.js";
export {
  getRouteDataResourceKey,
  getRouteDataResourceKeys,
  ROUTE_DATA_RESOURCE_KEY
} from "./resourceKeys.js";

export {
  createBrowserHistory,
  createMemoryHistory,
  createRouter,
  matchRoute
} from "./runtime.js";
export { updateHead } from "./clientMeta.js";

export type { RouteDefinition, RouteLayoutDefinition, RouteMetaConfig } from "./definition.js";
export type {
  LoadedLayoutModule,
  LoadedRouteMatch,
  RouteHydrationSnapshot,
  RouteLoadContext,
  RouteModule
} from "./loading.js";
export type { ResolvedRouteMetadata } from "./meta.js";
export type {
  GuardContext,
  NavigationGuard,
  NavigationResult,
  RouterNavigationSource,
  RouterNavigationState,
  RouteMatch,
  RouteParams,
  RouteQuery,
  RouteQueryValue,
  Router,
  RouterHistory,
  RouterOptions
} from "./runtime.js";
