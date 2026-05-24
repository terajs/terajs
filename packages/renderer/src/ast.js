/**
 * @file ast.ts
 * @description
 * Platform-agnostic AST definitions for Terajs's template compiler.
 *
 * This AST is intentionally renderer-neutral. It represents structure,
 * bindings, and directives without assuming DOM, JSX, or any platform.
 *
 * Renderers (web, native, terminal, canvas, etc.) consume this AST and
 * produce platform-specific UI output.
 */
export {};
