import { Debug } from "@terajs/shared";
import type { RouteDefinition } from "./definition";

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
}

export interface RouterHistory {
  getLocation(): string;
  push(path: string): void;
  replace(path: string): void;
  listen?(listener: (path: string) => void): () => void;
}

export interface Router {
  readonly routes: RouteDefinition[];
  readonly history: RouterHistory;
  start(): Promise<NavigationResult>;
  stop(): void;
  resolve(target: string): RouteMatch | null;
  getCurrentRoute(): RouteMatch | null;
  subscribe(listener: (match: RouteMatch | null) => void): () => void;
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

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.length > 1 && normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
}

function splitSegments(pathname: string): string[] {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") {
    return [];
  }

  return normalized.slice(1).split("/").filter(Boolean);
}

function scoreRoutePath(path: string): number {
  return splitSegments(path).reduce((score, segment) => {
    if (segment.startsWith(":")) {
      return score + 2;
    }

    return score + 10;
  }, 0);
}

function parseTarget(target: string): {
  pathname: string;
  fullPath: string;
  query: RouteQuery;
  hash: string;
} {
  const url = new URL(target, "https://terajs.local");
  const pathname = normalizePathname(url.pathname);
  const query: RouteQuery = {};

  url.searchParams.forEach((value, key) => {
    const previous = query[key];
    if (previous === undefined) {
      query[key] = value;
      return;
    }

    query[key] = Array.isArray(previous) ? [...previous, value] : [previous, value];
  });

  return {
    pathname,
    fullPath: `${pathname}${url.search}${url.hash}`,
    query,
    hash: url.hash ? url.hash.slice(1) : ""
  };
}

function matchPath(pattern: string, pathname: string): RouteParams | null {
  const patternSegments = splitSegments(pattern);
  const pathSegments = splitSegments(pathname);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const pathSegment = pathSegments[index];

    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

export function matchRoute(routes: RouteDefinition[], target: string): RouteMatch | null {
  const parsedTarget = parseTarget(target);

  const candidates = routes
    .map((route, index) => {
      const params = matchPath(route.path, parsedTarget.pathname);
      if (!params) {
        return null;
      }

      return {
        route,
        index,
        score: scoreRoutePath(route.path),
        match: {
          route,
          pathname: parsedTarget.pathname,
          fullPath: parsedTarget.fullPath,
          params,
          query: parsedTarget.query,
          hash: parsedTarget.hash
        } satisfies RouteMatch
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    });

  return candidates[0]?.match ?? null;
}

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

export function createBrowserHistory(browserWindow: Window = window): RouterHistory {
  const getLocation = () =>
    `${browserWindow.location.pathname}${browserWindow.location.search}${browserWindow.location.hash}`;

  return {
    getLocation,
    push: (path) => {
      browserWindow.history.pushState(null, "", path);
    },
    replace: (path) => {
      browserWindow.history.replaceState(null, "", path);
    },
    listen: (listener) => {
      const onPopState = () => {
        listener(getLocation());
      };

      browserWindow.addEventListener("popstate", onPopState);
      return () => {
        browserWindow.removeEventListener("popstate", onPopState);
      };
    }
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

export function createRouter(routes: RouteDefinition[], options: RouterOptions = {}): Router {
  const history = options.history ?? createMemoryHistory();
  const middleware = options.middleware ?? {};
  const listeners = new Set<(match: RouteMatch | null) => void>();

  let currentRoute: RouteMatch | null = null;
  let stopListening: (() => void) | null = null;

  function notify(): void {
    for (const listener of listeners) {
      listener(currentRoute);
    }
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
    },
    resolve: (target) => matchRoute(routes, target),
    getCurrentRoute: () => currentRoute,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    navigate: (target) => transitionTo(target, "push", false),
    replace: (target) => transitionTo(target, "replace", false)
  };

  async function transitionTo(
    target: string,
    historyMode: "none" | "push" | "replace",
    fromHistory: boolean
  ): Promise<NavigationResult> {
    const from = currentRoute;
    const parsedTarget = parseTarget(target);

    Debug.emit("route:navigate:start", {
      from: from?.fullPath ?? null,
      to: parsedTarget.fullPath,
      source: fromHistory ? "history" : historyMode
    });

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
        middleware: nextRoute.route.middleware
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
        redirectTo: middlewareResult
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
      route: nextRoute.route.path
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
  }

  return router;
}