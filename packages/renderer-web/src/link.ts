import { prefetchRoute, type Router } from "@terajs/router";

import { jsx } from "./jsx-runtime.js";
import { useCurrentRoute, useNavigationState, useRouter } from "./routerContext.js";

export interface LinkProps {
  router?: Router;
  to: string;
  replace?: boolean;
  prefetch?: boolean;
  exact?: boolean;
  activeClass?: string;
  pendingClass?: string;
  inactiveClass?: string;
  ariaCurrent?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  children?: any;
  onClick?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onTouchStart?: (event: TouchEvent) => void;
  [key: string]: unknown;
}

function isModifiedEvent(event: MouseEvent): boolean {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function isExternalTarget(target: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(target) || target.startsWith("//");
}

function shouldHandleNavigation(event: MouseEvent, props: LinkProps): boolean {
  if (event.defaultPrevented) {
    return false;
  }

  if (event.button !== 0 || isModifiedEvent(event)) {
    return false;
  }

  if (props.target && props.target !== "_self") {
    return false;
  }

  if (props.download) {
    return false;
  }

  if (isExternalTarget(props.to)) {
    return false;
  }

  return true;
}

function normalizeClassName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function isLinkActive(currentPath: string | undefined, target: string, exact: boolean): boolean {
  if (!currentPath || target.length === 0 || isExternalTarget(target)) {
    return false;
  }

  if (exact) {
    return currentPath === target;
  }

  return currentPath === target || currentPath.startsWith(`${target}/`);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function Link(props: LinkProps): Node {
  const {
    router: explicitRouter,
    to,
    replace,
    prefetch,
    exact,
    activeClass,
    pendingClass,
    inactiveClass,
    ariaCurrent = "page",
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onTouchStart,
    children,
    ...rest
  } = props;
  const router = explicitRouter ?? useRouter();
  const currentRoute = useCurrentRoute(router);
  const navigationState = useNavigationState(router);
  const baseClassName = normalizeClassName(rest.className ?? rest.class);
  let prefetchState: "idle" | "pending" | "complete" = "idle";
  let prefetchController: AbortController | null = null;

  const isPending = () => isLinkActive(navigationState().to ?? undefined, to, exact === true);

  const cancelPrefetchTarget = () => {
    if (prefetchState !== "pending" || !prefetchController) {
      return;
    }

    const controller = prefetchController;
    prefetchController = null;
    prefetchState = "idle";
    controller.abort("prefetch-intent-ended");
  };

  const preservePrefetchTarget = () => {
    if (!prefetchController) {
      return;
    }

    prefetchController = null;
    prefetchState = "complete";
  };

  const prefetchTarget = () => {
    if (!prefetch || prefetchState !== "idle" || isExternalTarget(to)) {
      return;
    }

    const controller = new AbortController();
    prefetchController = controller;
    prefetchState = "pending";

    void prefetchRoute(router, to, controller.signal)
      .then(() => {
        if (prefetchController !== controller) {
          return;
        }

        prefetchController = null;
        prefetchState = "complete";
      })
      .catch((error) => {
        if (prefetchController === controller) {
          prefetchController = null;
          prefetchState = "idle";
        }

        if (!isAbortError(error) && !controller.signal.aborted) {
          return;
        }
      });
  };

  const resolveClassName = () => {
    const active = isLinkActive(currentRoute()?.fullPath, to, exact === true);
    const stateClassName = isPending()
      ? normalizeClassName(pendingClass)
      : active
        ? normalizeClassName(activeClass)
        : normalizeClassName(inactiveClass);
    return [baseClassName, stateClassName].filter((value): value is string => Boolean(value)).join(" ") || undefined;
  };

  return jsx("a", {
    ...rest,
    class: resolveClassName,
    "data-pending": () => isPending() ? "true" : undefined,
    "aria-busy": () => isPending() ? "true" : undefined,
    "aria-current": () => isLinkActive(currentRoute()?.fullPath, to, exact === true) ? ariaCurrent : undefined,
    href: to,
    onMouseEnter: (event: MouseEvent) => {
      onMouseEnter?.(event);
      prefetchTarget();
    },
    onMouseLeave: (event: MouseEvent) => {
      onMouseLeave?.(event);
      cancelPrefetchTarget();
    },
    onFocus: (event: FocusEvent) => {
      onFocus?.(event);
      prefetchTarget();
    },
    onBlur: (event: FocusEvent) => {
      onBlur?.(event);
      cancelPrefetchTarget();
    },
    onTouchStart: (event: TouchEvent) => {
      onTouchStart?.(event);
      prefetchTarget();
    },
    onClick: async (event: MouseEvent) => {
      onClick?.(event);
      if (!shouldHandleNavigation(event, props)) {
        return;
      }

      event.preventDefault();
      preservePrefetchTarget();
      if (replace) {
        await router.replace(to);
        return;
      }

      await router.navigate(to);
    },
    children
  });
}