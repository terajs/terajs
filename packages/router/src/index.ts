/**
 * @file index.ts
 * @description
 * Entry point for the @terajs/router package.
 */

export { createRouteHydrationSnapshot, loadRouteMatch } from "./loading";
export { resolveLoadedRouteMetadata } from "./meta";

export {
  createBrowserHistory,
  createMemoryHistory,
  createRouter,
  matchRoute
} from "./runtime";

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
  RouteMatch,
  RouteParams,
  RouteQuery,
  RouteQueryValue,
  Router,
  RouterHistory,
  RouterOptions
} from "./runtime";
