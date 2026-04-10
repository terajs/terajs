import type { Router, RouterNavigationState } from "@terajs/router";
import type { TemplateFn } from "./template.js";
import { useNavigationState } from "./routerContext.js";

export interface RoutePendingProps {
  router?: Router;
  when?: (state: RouterNavigationState) => boolean;
  children?: any | ((state: RouterNavigationState) => any);
  fallback?: any | ((state: RouterNavigationState) => any);
}

function resolveRenderable<T>(value: T | ((state: RouterNavigationState) => T), state: RouterNavigationState): T {
  return typeof value === "function"
    ? (value as (currentState: RouterNavigationState) => T)(state)
    : value;
}

function normalizePendingContent(value: any): Node {
  if (value == null || value === false || value === true) {
    return document.createTextNode("");
  }

  if (value instanceof Node) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    return document.createTextNode(String(value));
  }

  throw new Error("Terajs RoutePending: unsupported child content.");
}

export function useIsNavigating(router?: Router): () => boolean {
  const navigationState = useNavigationState(router);
  return () => navigationState().pending;
}

export function usePendingTarget(router?: Router): () => string | null {
  const navigationState = useNavigationState(router);
  return () => navigationState().to;
}

export function RoutePending(props: RoutePendingProps): TemplateFn {
  const navigationState = useNavigationState(props.router);

  return () => {
    const state = navigationState();
    const shouldRender = props.when ? props.when(state) : state.pending;
    const content = shouldRender ? props.children : props.fallback;
    return normalizePendingContent(resolveRenderable(content, state));
  };
}