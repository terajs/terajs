import { Debug } from "@terajs/shared";
import type { RouteDefinition } from "./definition.js";
import { summarizeRouteBranch } from "./debugPayload.js";
import { matchRoute, parseTarget } from "./matching.js";

export { matchRoute, resolveComponentStack } from "./matching.js";

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
  branch?: RouteMatch[];
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
  push(target: string): Promise<NavigationResult>;
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

export type NavigationResult =
  | {
      type: "success";
      from: RouteMatch | null;
      match: RouteMatch;
    }
  | {
      type: "blocked";
      from: RouteMatch | null;
      to: string;
    }
  | {
      type: "not-found";
      from: RouteMatch | null;
      to: string;
    }
  | {
      type: "redirect";
      from: RouteMatch | null;
      to: string;
      redirectedTo: RouteMatch;
    };

/**
 * Creates an in-memory history implementation.
 *
 * Useful for tests and non-browser environments.
 */
export function createMemoryHistory(initialPath = "/"): RouterHistory {
  let currentPath = parseTarget(initialPath).fullPath;

  return {
    getLocation: () => currentPath,
    push: (path) => {
      currentPath = parseTarget(path).fullPath;
    },
    replace: (path) => {
      currentPath = parseTarget(path).fullPath;
    },
    listen: () => () => undefined
  };
}

async function runMiddleware(
  middlewareMap: Record<string, NavigationGuard>,
  route: RouteMatch,
  from: RouteMatch | null,
  router: Router
): Promise<void | boolean | string> {
  for (const middlewareName of route.route.middleware) {
    const middleware = middlewareMap[middlewareName];
    if (!middleware) {
      throw new Error(`Unknown router middleware: ${middlewareName}`);
    }

    const result = await middleware({ to: route, from, router });
    if (result === false || typeof result === "string") {
      return result;
    }
  }

  return true;
}

/**
 * Creates a router with route matching, middleware, and navigation state.
 */
export function createRouter(routes: RouteDefinition[], options: RouterOptions = {}): Router {
  const history = options.history ?? createMemoryHistory();
  const middleware = options.middleware ?? {};
  const listeners = new Set<(match: RouteMatch | null) => void>();
  const navigationListeners = new Set<(state: RouterNavigationState) => void>();

  let currentRoute: RouteMatch | null = null;
  let stopListening: (() => void) | null = null;
  let pendingTransitions = 0;
  let navigationState: RouterNavigationState = {
    pending: false,
    from: null,
    to: null,
    source: null
  };

  function notify(): void {
    for (const listener of listeners) {
      listener(currentRoute);
    }
  }

  function notifyNavigation(): void {
    for (const listener of navigationListeners) {
      listener(navigationState);
    }
  }

  function setNavigationState(nextState: RouterNavigationState): void {
    navigationState = nextState;
    notifyNavigation();
  }

  const router: Router = {
    routes,
    history,
    start: async () => {
      if (!stopListening && history.listen) {
        stopListening = history.listen((path) => {
          void transitionTo(path, "none", true);
        });
      }

      return transitionTo(history.getLocation(), "none", true);
    },
    stop: () => {
      stopListening?.();
      stopListening = null;
      listeners.clear();
      navigationListeners.clear();
    },
    resolve: (target) => matchRoute(routes, target),
    getCurrentRoute: () => currentRoute,
    getNavigationState: () => navigationState,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    subscribeNavigation: (listener) => {
      navigationListeners.add(listener);
      return () => {
        navigationListeners.delete(listener);
      };
    },
    navigate: (target) => transitionTo(target, "push", false),
    push: (target) => transitionTo(target, "push", false),
    replace: (target) => transitionTo(target, "replace", false)
  };

  async function transitionTo(
    target: string,
    historyMode: RouterNavigationSource,
    fromHistory: boolean
  ): Promise<NavigationResult> {
    const from = currentRoute;
    const parsedTarget = parseTarget(target);
    pendingTransitions += 1;
    setNavigationState({
      pending: true,
      from,
      to: parsedTarget.fullPath,
      source: fromHistory ? "history" : historyMode
    });

    Debug.emit("route:navigate:start", {
      from: from?.fullPath ?? null,
      to: parsedTarget.fullPath,
      source: fromHistory ? "history" : historyMode
    });

    try {
      const nextRoute = router.resolve(target);

      if (!nextRoute) {
        if (fromHistory && from) {
          history.replace(from.fullPath);
        }

        Debug.emit("error:router", {
          message: `No route matched ${parsedTarget.fullPath}`,
          from: from?.fullPath ?? null,
          to: parsedTarget.fullPath
        });

        return {
          type: "not-found",
          from,
          to: parsedTarget.fullPath
        };
      }

      const middlewareResult = await runMiddleware(middleware, nextRoute, from, router);

      if (middlewareResult === false) {
        if (fromHistory && from) {
          history.replace(from.fullPath);
        }

        Debug.emit("route:blocked", {
          from: from?.fullPath ?? null,
          to: nextRoute.fullPath,
          middleware: nextRoute.route.middleware,
          branch: summarizeRouteBranch(nextRoute)
        });

        Debug.emit("route:warn", {
          message: `Navigation blocked for ${nextRoute.fullPath}`,
          from: from?.fullPath ?? null,
          to: nextRoute.fullPath
        });

        return {
          type: "blocked",
          from,
          to: nextRoute.fullPath
        };
      }

      if (typeof middlewareResult === "string") {
        Debug.emit("route:redirect", {
          from: from?.fullPath ?? null,
          to: nextRoute.fullPath,
          redirectTo: middlewareResult,
          branch: summarizeRouteBranch(nextRoute)
        });

        const redirectResult = await transitionTo(middlewareResult, "replace", false);
        if (redirectResult.type === "success") {
          return {
            type: "redirect",
            from,
            to: nextRoute.fullPath,
            redirectedTo: redirectResult.match
          };
        }

        return redirectResult;
      }

      if (historyMode === "push") {
        history.push(nextRoute.fullPath);
      } else if (historyMode === "replace") {
        history.replace(nextRoute.fullPath);
      }

      currentRoute = nextRoute;
      Debug.emit("route:changed", {
        from: from?.fullPath ?? null,
        to: nextRoute.fullPath,
        params: nextRoute.params,
        query: nextRoute.query,
        route: nextRoute.route.path,
        branch: summarizeRouteBranch(nextRoute),
        leafRoute: {
          id: nextRoute.route.id,
          path: nextRoute.route.path,
          filePath: nextRoute.route.filePath
        }
      });
      Debug.emit("route:navigate:end", {
        from: from?.fullPath ?? null,
        to: nextRoute.fullPath,
        source: fromHistory ? "history" : historyMode
      });
      notify();

      return {
        type: "success",
        from,
        match: nextRoute
      };
    } finally {
      pendingTransitions = Math.max(0, pendingTransitions - 1);
      if (pendingTransitions === 0) {
        setNavigationState({
          pending: false,
          from: null,
          to: null,
          source: null
        });
      }
    }
  }

  return router;
}
