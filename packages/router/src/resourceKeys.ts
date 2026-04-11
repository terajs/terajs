export const ROUTE_DATA_RESOURCE_KEY = "route:data";

export function getRouteDataResourceKey(routeId: string): string {
  return `route:${routeId}:data`;
}

export function getRouteDataResourceKeys(routeId: string): string[] {
  return [ROUTE_DATA_RESOURCE_KEY, getRouteDataResourceKey(routeId)];
}