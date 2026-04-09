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
} from "./loading";
export { resolveLoadedRouteMetadata } from "./meta";
export {
  getRouteDataResourceKey,
  getRouteDataResourceKeys,
  ROUTE_DATA_RESOURCE_KEY
} from "./resourceKeys";

export {
  createBrowserHistory,
  createMemoryHistory,
  createRouter,
  matchRoute
} from "./runtime";
export { updateHead } from "./clientMeta";

export type { RouteDefinition, RouteLayoutDefinition, RouteMetaConfig } from "./definition";
export type {
  LoadedLayoutModule,
  LoadedRouteMatch,
  RouteHydrationSnapshot,
  RouteLoadContext,
  RouteModule
} from "./loading";
export type { ResolvedRouteMetadata } from "./meta";
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
} from "./runtime";
