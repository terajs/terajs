import type { Router } from "@terajs/router";
import type { RouteMatch, RouterNavigationState } from "@terajs/router";
import { signal, type Signal } from "@terajs/reactivity";
import { inject, onCleanup, provide } from "@terajs/runtime";

export const ROUTER_CONTEXT = Symbol("terajs.router.context");

export interface RouterProviderProps {
  router: Router;
  children?: any;
}

export function provideRouter(router: Router): Router {
  provide(ROUTER_CONTEXT, router);
  return router;
}

export function useRouter(fallback?: Router): Router {
  if (arguments.length === 1) {
    return inject(ROUTER_CONTEXT, fallback);
  }

  return inject<Router>(ROUTER_CONTEXT);
}

export function useCurrentRoute(router?: Router): Signal<RouteMatch | null> {
  const resolvedRouter = router ?? useRouter();
  const currentRoute = signal<RouteMatch | null>(resolvedRouter.getCurrentRoute());
  const unsubscribe = resolvedRouter.subscribe((match) => {
    currentRoute.set(match);
  });

  onCleanup(unsubscribe);
  return currentRoute;
}

export function useNavigationState(router?: Router): Signal<RouterNavigationState> {
  const resolvedRouter = router ?? useRouter();
  const navigationState = signal<RouterNavigationState>(resolvedRouter.getNavigationState());
  const unsubscribe = resolvedRouter.subscribeNavigation((state) => {
    navigationState.set(state);
  });

  onCleanup(unsubscribe);
  return navigationState;
}

export function withRouterContext<T>(router: Router, render: () => T): T {
  provideRouter(router);
  return render();
}

export function RouterProvider(props: RouterProviderProps): any {
  return withRouterContext(props.router, () => {
    if (typeof props.children === "function") {
      return props.children();
    }

    return props.children ?? null;
  });
}