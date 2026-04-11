/**
 * @file hydration.ts
 * @description
 * Abstract hydration API for Terajs.
 *
 * Renderers may implement hydration for SSR/edge rendering.
 * The core SFC compiler does not assume DOM or browser APIs.
 */

export type HydrationMode =
  | "eager"
  | "visible"
  | "idle"
  | "interaction"
  | "none"
  | "ai";

/**
 * Hydration scheduler interface.
 * Renderers implement this to define how hydration is triggered.
 */
export interface HydrationAPI<Root = any> {
  scheduleHydration(
    mode: HydrationMode,
    mount: () => void,
    root: Root
  ): void;
}
