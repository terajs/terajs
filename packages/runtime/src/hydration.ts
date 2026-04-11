import type { HydrationMode } from "@terajs/shared";

export interface RuntimeHydrationState {
  resources?: Record<string, unknown>;
}

let hydrationState: RuntimeHydrationState = {};

export function setHydrationState(next: RuntimeHydrationState): void {
  hydrationState = {
    resources: next.resources ? { ...next.resources } : undefined
  };
}

export function getHydratedResource<TValue = unknown>(key: string): TValue | undefined {
  return hydrationState.resources?.[key] as TValue | undefined;
}

export function consumeHydratedResource<TValue = unknown>(key: string): TValue | undefined {
  const value = getHydratedResource<TValue>(key);
  if (hydrationState.resources && key in hydrationState.resources) {
    delete hydrationState.resources[key];
  }
  return value;
}

/**
 * Schedules hydration of a server-rendered component according to the given mode.
 *
 * @param mode - Hydration strategy to use.
 * @param mount - Function that performs the actual client-side mount/hydration.
 * @param el - Root DOM element for the component.
 */
export function scheduleHydration(
  mode: HydrationMode,
  mount: () => void,
  el: Element
): void {
  switch (mode) {
    case "eager":
      mount();
      break;
    case "visible":
      onVisible(el, mount);
      break;
    case "idle":
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => mount());
      } else {
        setTimeout(mount, 0);
      }
      break;
    case "interaction":
      onFirstInteraction(el, mount);
      break;
    case "none":
      // Intentionally do nothing; this component remains static HTML.
      break;
    case "ai":
      // Placeholder: AI-based strategy selection can be implemented here.
      // For now, fall back to "visible" as a reasonable default.
      scheduleHydration("visible", mount, el);
      break;
  }
}

/**
 * Calls the given callback when the element becomes visible in the viewport.
 */
function onVisible(el: Element, cb: () => void): void {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.disconnect();
        cb();
        break;
      }
    }
  });
  observer.observe(el);
}

/**
 * Calls the given callback on the first user interaction with the element.
 */
function onFirstInteraction(el: Element, cb: () => void): void {
  const handler = () => {
    el.removeEventListener("click", handler);
    el.removeEventListener("focus", handler);
    el.removeEventListener("mouseenter", handler);
    cb();
  };
  el.addEventListener("click", handler);
  el.addEventListener("focus", handler);
  el.addEventListener("mouseenter", handler);
}