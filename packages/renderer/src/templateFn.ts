/**
 * @file templateFn.ts
 * @description
 * Platform-agnostic template function contract for Terajs.
 *
 * A TemplateFn is a renderer-neutral function that produces a
 * platform-specific UI node. Renderers decide what “node” means:
 * - Web: DOM Node
 * - Native: native widget
 * - Terminal: text layout object
 * - Canvas: draw instructions
 */

export type TemplateFn<Output = any> = (ctx: any) => Output;
