import type { ComponentContext } from "@terajs/runtime";
import type { RouteOutletRenderContext } from "./routeOutlet.js";

const ROUTE_OUTLET_CONTEXT = "__teraRouteOutletContext";

type RouteOutletComponentContext = ComponentContext & {
  [ROUTE_OUTLET_CONTEXT]?: RouteOutletRenderContext;
};

export function bindRouteOutletRenderContext(
  componentContext: ComponentContext,
  outletContext: RouteOutletRenderContext
): void {
  (componentContext as RouteOutletComponentContext)[ROUTE_OUTLET_CONTEXT] = outletContext;
}

export function inheritRouteOutletRenderContext(
  parentContext: ComponentContext | null,
  childContext: ComponentContext
): void {
  const outletContext = readRouteOutletRenderContext(parentContext);
  if (outletContext) {
    bindRouteOutletRenderContext(childContext, outletContext);
  }
}

export function readRouteOutletRenderContext(
  componentContext: ComponentContext | null
): RouteOutletRenderContext | null {
  return (componentContext as RouteOutletComponentContext | null)?.[ROUTE_OUTLET_CONTEXT] ?? null;
}
