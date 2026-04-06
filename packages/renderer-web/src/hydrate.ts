/**
 * @file hydrate.ts
 * @description
 * Client-side hydration entry for Nebula.
 *
 * Responsibilities:
 * - read SSR hydration marker
 * - determine hydration mode
 * - schedule hydration using runtime's scheduler
 * - call renderer-web's mount() at the correct time
 */

import { scheduleHydration } from "@terajs/runtime";
import type { RouteHydrationSnapshot } from "@terajs/router";
import type { HydrationMode } from "@terajs/shared";
import { mount } from "./mount";
import type { FrameworkComponent } from "./render";

export interface HydrationPayload {
  mode: HydrationMode | "ai";
  ai?: Record<string, unknown>;
  routeSnapshot?: RouteHydrationSnapshot<unknown>;
}

/**
 * Parse the SSR hydration marker.
 */
export function readHydrationPayload(): HydrationPayload {
  const script = document.querySelector<HTMLScriptElement>(
    'script[type="application/nebula-hydration"]'
  );

  if (!script || !script.textContent) {
    return { mode: "eager" };
  }

  try {
    const payload = JSON.parse(script.textContent);
    return {
      mode: payload.mode ?? "eager",
      ai: payload.ai,
      routeSnapshot: payload.routeSnapshot
    };
  } catch {
    return { mode: "eager" };
  }
}

/**
 * Hydrate the root component into the given root element.
 *
 * @param component - The root component to hydrate.
 * @param root - The DOM element containing SSR HTML.
 * @param props - Optional props for the root component.
 */
export function hydrateRoot(
  component: FrameworkComponent,
  root: HTMLElement,
  props?: any
): void {
  const payload = readHydrationPayload();

  scheduleHydration(
    payload.mode,
    () => {
      // Replace SSR HTML with a fresh client-side mount
      mount(component, root, props);
    },
    root
  );
}

