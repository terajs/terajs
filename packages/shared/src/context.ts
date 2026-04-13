/**
 * @file context.ts
 * Shared component execution context contract.
 */

import { Debug } from "./debug/events.js";
import type { ComponentErrorBoundaryHandler } from "./errorBoundary.js";

export type Disposer = () => void;

export interface ComponentContext {
  disposers: Disposer[];
  props: any;
  frame: any;
  name: string;
  instance: number;
  meta?: unknown;
  ai?: unknown;
  route?: unknown;
  errorBoundary?: ComponentErrorBoundaryHandler;

  mounted?: Array<() => void>;
  updated?: Array<() => void>;
  unmounted?: Array<() => void>;
}

let currentContext: ComponentContext | null = null;

export function getCurrentContext(): ComponentContext | null {
  Debug.emit("component:context:get", { context: currentContext });
  return currentContext;
}

export function setCurrentContext(ctx: ComponentContext | null): void {
  Debug.emit("component:context:set", { context: ctx });
  currentContext = ctx;
}

export function createComponentContext(): ComponentContext {
  const ctx: ComponentContext = {
    disposers: [],
    props: null,
    frame: null,
    name: "Unknown",
    instance: 0,
    meta: undefined,
    ai: undefined,
    route: undefined,
    errorBoundary: undefined,
    mounted: [],
    updated: [],
    unmounted: []
  };

  Debug.emit("component:context:create", { context: ctx });

  return ctx;
}

