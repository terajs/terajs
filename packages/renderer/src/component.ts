/**
 * @file component.ts
 * @description
 * Platform-agnostic component contract for Nebula.
 *
 * A FrameworkComponent is a function that receives props and returns
 * either:
 * - a TemplateFn (reactive component)
 * - a platform-specific node (static component)
 *
 * Renderers decide how to interpret the returned value.
 */

import type { TemplateFn } from "./templateFn";

export type FrameworkComponent<Props = any, Output = any> =
  (props?: Props) => Output | TemplateFn<Output>;
