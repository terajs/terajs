// devtools/src/routeSessions.ts
import type { DevtoolsEvent } from "./app";

export class RouteSessions {
  currentRoute = "__unknown__";
  sessions = new Map<string, DevtoolsEvent[]>([["__unknown__", []]]);

  hydrate(events: readonly DevtoolsEvent[]) {
    this.currentRoute = "__unknown__";
    this.sessions = new Map<string, DevtoolsEvent[]>([["__unknown__", []]]);

    for (const event of events) {
      this.handle(event);
    }
  }

  handle(event: DevtoolsEvent) {
    const routeTarget = this.resolveRouteTarget(event);

    if (event.type === "route:changed" || (this.currentRoute === "__unknown__" && routeTarget)) {
      this.currentRoute = routeTarget ?? "__unknown__";
    }

    if (!this.sessions.has(this.currentRoute)) {
      this.sessions.set(this.currentRoute, []);
    }

    const bucket = this.sessions.get(this.currentRoute);
    if (bucket) bucket.push(event);
  }

  getEventsForRoute(route: string) {
    return this.sessions.get(route) ?? [];
  }

  getCurrentRouteEvents(allEvents: readonly DevtoolsEvent[]): DevtoolsEvent[] {
    const currentBucket = this.sessions.get(this.currentRoute);
    if (!currentBucket || currentBucket.length === 0) {
      return [...allEvents];
    }

    const activeEvents = new Set(allEvents);
    const visibleEvents = currentBucket.filter((event) => activeEvents.has(event));
    return visibleEvents.length > 0 ? visibleEvents : [...allEvents];
  }

  getRoutes() {
    return Array.from(this.sessions.keys());
  }

  private resolveRouteTarget(event: DevtoolsEvent): string | null {
    if (typeof event.payload?.to === "string") {
      return event.payload.to;
    }

    if (typeof event.payload?.route === "string") {
      return event.payload.route;
    }

    return typeof (event as DevtoolsEvent & { to?: unknown }).to === "string"
      ? (event as DevtoolsEvent & { to?: string }).to ?? null
      : null;
  }
}
