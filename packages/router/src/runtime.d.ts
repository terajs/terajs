import type { RouteDefinition } from "./definition.js";
export type RouteParams = Record<string, string>;
export type RouteQueryValue = string | string[];
export type RouteQuery = Record<string, RouteQueryValue>;
export interface RouteMatch {
    route: RouteDefinition;
    pathname: string;
    fullPath: string;
    params: RouteParams;
    query: RouteQuery;
    hash: string;
    componentStack?: any[];
}
export interface RouterHistory {
    getLocation(): string;
    push(path: string): void;
    replace(path: string): void;
    listen?(listener: (path: string) => void): () => void;
}
export type RouterNavigationSource = "history" | "push" | "replace" | "none";
export interface RouterNavigationState {
    pending: boolean;
    from: RouteMatch | null;
    to: string | null;
    source: RouterNavigationSource | null;
}
export interface Router {
    readonly routes: RouteDefinition[];
    readonly history: RouterHistory;
    start(): Promise<NavigationResult>;
    stop(): void;
    resolve(target: string): RouteMatch | null;
    getCurrentRoute(): RouteMatch | null;
    getNavigationState(): RouterNavigationState;
    subscribe(listener: (match: RouteMatch | null) => void): () => void;
    subscribeNavigation(listener: (state: RouterNavigationState) => void): () => void;
    navigate(target: string): Promise<NavigationResult>;
    replace(target: string): Promise<NavigationResult>;
}
export interface GuardContext {
    to: RouteMatch;
    from: RouteMatch | null;
    router: Router;
}
export type GuardResult = void | boolean | string | Promise<void | boolean | string>;
export type NavigationGuard = (context: GuardContext) => GuardResult;
export interface RouterOptions {
    history?: RouterHistory;
    middleware?: Record<string, NavigationGuard>;
}
export type NavigationResult = {
    type: "success";
    from: RouteMatch | null;
    match: RouteMatch;
} | {
    type: "blocked";
    from: RouteMatch | null;
    to: string;
} | {
    type: "not-found";
    from: RouteMatch | null;
    to: string;
} | {
    type: "redirect";
    from: RouteMatch | null;
    to: string;
    redirectedTo: RouteMatch;
};
/**
 * Builds the ordered render stack for a matched route.
 *
 * The current implementation includes an optional route-level layout followed
 * by the route component.
 */
export declare function resolveComponentStack(route: RouteDefinition): any[];
/**
 * Resolves the best route match for a target URL.
 *
 * Matching uses static segment priority over dynamic segment priority.
 */
export declare function matchRoute(routes: RouteDefinition[], target: string): RouteMatch | null;
/**
 * Creates an in-memory history implementation.
 *
 * Useful for tests and non-browser environments.
 */
export declare function createMemoryHistory(initialPath?: string): RouterHistory;
/**
 * Creates a router with route matching, middleware, and navigation state.
 */
export declare function createRouter(routes: RouteDefinition[], options?: RouterOptions): Router;
//# sourceMappingURL=runtime.d.ts.map