import { Debug } from "@terajs/shared";
/**
 * Builds the ordered render stack for a matched route.
 *
 * The current implementation includes an optional route-level layout followed
 * by the route component.
 */
export function resolveComponentStack(route) {
    const stack = [];
    if (route.layout) {
        stack.push(route.layout);
    }
    stack.push(route.component);
    return stack;
}
function normalizePathname(pathname) {
    if (!pathname || pathname === "/") {
        return "/";
    }
    const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return normalized.length > 1 && normalized.endsWith("/")
        ? normalized.slice(0, -1)
        : normalized;
}
function splitSegments(pathname) {
    const normalized = normalizePathname(pathname);
    if (normalized === "/") {
        return [];
    }
    return normalized.slice(1).split("/").filter(Boolean);
}
function scoreRoutePath(path) {
    return splitSegments(path).reduce((score, segment) => {
        if (segment.startsWith(":")) {
            return score + 2;
        }
        return score + 10;
    }, 0);
}
function parseTarget(target) {
    const url = new URL(target, "https://terajs.local");
    const pathname = normalizePathname(url.pathname);
    const query = {};
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
function matchPath(pattern, pathname) {
    const patternSegments = splitSegments(pattern);
    const pathSegments = splitSegments(pathname);
    if (patternSegments.length !== pathSegments.length) {
        return null;
    }
    const params = {};
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
/**
 * Resolves the best route match for a target URL.
 *
 * Matching uses static segment priority over dynamic segment priority.
 */
export function matchRoute(routes, target) {
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
                hash: parsedTarget.hash,
                componentStack: resolveComponentStack(route)
            }
        };
    })
        .filter((candidate) => candidate !== null)
        .sort((left, right) => {
        if (right.score !== left.score) {
            return right.score - left.score;
        }
        return left.index - right.index;
    });
    return candidates[0]?.match ?? null;
}
/**
 * Creates an in-memory history implementation.
 *
 * Useful for tests and non-browser environments.
 */
export function createMemoryHistory(initialPath = "/") {
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
async function runMiddleware(middlewareMap, route, from, router) {
    for (const middlewareName of route.route.middleware) {
        const middleware = middlewareMap[middlewareName];
        if (!middleware) {
            throw new Error(`Unknown router middleware: ${middlewareName}`);
        }
        const result = await middleware({ to: route, from, router });
        if (result === false || typeof result === "string") {
            return {
                result,
                guardName: middlewareName
            };
        }
    }
    return {
        result: true,
        guardName: null
    };
}
/**
 * Creates a router with route matching, middleware, and navigation state.
 */
export function createRouter(routes, options = {}) {
    const history = options.history ?? createMemoryHistory();
    const middleware = options.middleware ?? {};
    const listeners = new Set();
    const navigationListeners = new Set();
    let currentRoute = null;
    let stopListening = null;
    let pendingTransitions = 0;
    let navigationState = {
        pending: false,
        from: null,
        to: null,
        source: null
    };
    function notify() {
        for (const listener of listeners) {
            listener(currentRoute);
        }
    }
    function notifyNavigation() {
        for (const listener of navigationListeners) {
            listener(navigationState);
        }
    }
    function setNavigationState(nextState) {
        navigationState = nextState;
        notifyNavigation();
    }
    const router = {
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
        replace: (target) => transitionTo(target, "replace", false)
    };
    async function transitionTo(target, historyMode, fromHistory) {
        const from = currentRoute;
        const parsedTarget = parseTarget(target);
        const source = fromHistory ? "history" : historyMode;
        const navigationStartedAt = Date.now();
        pendingTransitions += 1;
        setNavigationState({
            pending: true,
            from,
            to: parsedTarget.fullPath,
            source
        });
        Debug.emit("route:navigate:start", {
            from: from?.fullPath ?? null,
            to: parsedTarget.fullPath,
            source,
            query: parsedTarget.query,
            phase: "start"
        });
        try {
            const nextRoute = router.resolve(target);
            if (!nextRoute) {
                if (fromHistory && from) {
                    history.replace(from.fullPath);
                }
                const durationMs = Math.max(0, Date.now() - navigationStartedAt);
                Debug.emit("error:router", {
                    message: `No route matched ${parsedTarget.fullPath}`,
                    from: from?.fullPath ?? null,
                    to: parsedTarget.fullPath,
                    source,
                    query: parsedTarget.query,
                    phase: "not-found",
                    durationMs
                });
                return {
                    type: "not-found",
                    from,
                    to: parsedTarget.fullPath
                };
            }
            const middlewareResolution = await runMiddleware(middleware, nextRoute, from, router);
            const middlewareResult = middlewareResolution.result;
            if (middlewareResult === false) {
                if (fromHistory && from) {
                    history.replace(from.fullPath);
                }
                const durationMs = Math.max(0, Date.now() - navigationStartedAt);
                Debug.emit("route:blocked", {
                    from: from?.fullPath ?? null,
                    to: nextRoute.fullPath,
                    route: nextRoute.route.path,
                    params: nextRoute.params,
                    query: nextRoute.query,
                    source,
                    middleware: nextRoute.route.middleware,
                    guardName: middlewareResolution.guardName,
                    phase: "blocked",
                    durationMs
                });
                Debug.emit("route:warn", {
                    message: `Navigation blocked for ${nextRoute.fullPath}`,
                    from: from?.fullPath ?? null,
                    to: nextRoute.fullPath,
                    route: nextRoute.route.path,
                    params: nextRoute.params,
                    query: nextRoute.query,
                    source,
                    middleware: nextRoute.route.middleware,
                    guardName: middlewareResolution.guardName,
                    phase: "blocked",
                    durationMs
                });
                return {
                    type: "blocked",
                    from,
                    to: nextRoute.fullPath
                };
            }
            if (typeof middlewareResult === "string") {
                const durationMs = Math.max(0, Date.now() - navigationStartedAt);
                Debug.emit("route:redirect", {
                    from: from?.fullPath ?? null,
                    to: nextRoute.fullPath,
                    route: nextRoute.route.path,
                    params: nextRoute.params,
                    query: nextRoute.query,
                    source,
                    redirectTo: middlewareResult,
                    middleware: nextRoute.route.middleware,
                    guardName: middlewareResolution.guardName,
                    phase: "redirect",
                    durationMs
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
            }
            else if (historyMode === "replace") {
                history.replace(nextRoute.fullPath);
            }
            currentRoute = nextRoute;
            const durationMs = Math.max(0, Date.now() - navigationStartedAt);
            Debug.emit("route:changed", {
                from: from?.fullPath ?? null,
                to: nextRoute.fullPath,
                params: nextRoute.params,
                query: nextRoute.query,
                route: nextRoute.route.path,
                source,
                phase: "resolved",
                durationMs
            });
            Debug.emit("route:navigate:end", {
                from: from?.fullPath ?? null,
                to: nextRoute.fullPath,
                source,
                phase: "completed",
                durationMs
            });
            notify();
            return {
                type: "success",
                from,
                match: nextRoute
            };
        }
        finally {
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
