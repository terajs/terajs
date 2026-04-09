/**
 * @file hydrate.ts
 * @description
 * Client-side hydration entry for Terajs.
 *
 * Responsibilities:
 * - read SSR hydration marker
 * - determine hydration mode
 * - schedule hydration using runtime's scheduler
 * - call renderer-web's mount() at the correct time
 */

import { scheduleHydration, setHydrationState } from "@terajs/runtime";
import type { RouteHydrationSnapshot } from "@terajs/router";
import type { HydrationMode } from "@terajs/shared";
import { mount } from "./mount";
import type { FrameworkComponent } from "./render";
import { validateHydration } from "./hydration/diagnostics";
import { installTeraSwap } from "./hydration/streamUtils";

export interface HydrationPayload {
  mode: HydrationMode | "ai";
  ai?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  routeSnapshot?: RouteHydrationSnapshot<unknown>;
}

/**
 * Parse the SSR hydration marker.
 */
export function readHydrationPayload(): HydrationPayload {
  const script = document.querySelector<HTMLScriptElement>(
    'script[type="application/terajs-hydration"]'
  );

  if (!script || !script.textContent) {
    return { mode: "eager" };
  }

  try {
    const payload = JSON.parse(script.textContent);
    const parsed = {
      mode: payload.mode ?? "eager",
      ai: payload.ai,
      resources: payload.resources,
      routeSnapshot: payload.routeSnapshot
    };
    setHydrationState({ resources: parsed.resources });
    return parsed;
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
  const isDev = process.env.NODE_ENV === "development";
  let serverSnapshot = "";

  if (isDev) {
    serverSnapshot = root.innerHTML;
  }

  installTeraSwap();

  scheduleHydration(
    payload.mode,
    () => {
      // Replace SSR HTML with a fresh client-side mount
      mount(component, root, props);

      if (isDev) {
        validateHydration(root, serverSnapshot);
      }
    },
    root
  );
}

