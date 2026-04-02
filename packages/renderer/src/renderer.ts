/**
 * @file renderer.ts
 * @description
 * Platform-agnostic renderer interface for Nebula.
 *
 * Renderers (web, native, terminal, etc.) implement this interface to
 * convert Nebula's AST into platform-specific UI output.
 */

import type {
  ASTNode,
  ElementNode,
  TextNode,
  InterpolationNode,
  IfNode,
  ForNode
} from "./ast";

/**
 * Rendering context passed to all renderer functions.
 * Renderers may extend this with platform-specific data.
 */
export interface RenderContext {
  /** Arbitrary renderer-specific state. */
  state?: any;
}

/**
 * A platform-agnostic renderer implementation.
 *
 * Each renderer consumes AST nodes and produces platform-specific output:
 * - Web: DOM nodes or JSX
 * - Native: native widgets
 * - Terminal: text layout
 * - Canvas: draw instructions
 */
export interface Renderer {
  renderElement(node: ElementNode, ctx: RenderContext): any;
  renderText(node: TextNode, ctx: RenderContext): any;
  renderInterpolation(node: InterpolationNode, ctx: RenderContext): any;
  renderIf(node: IfNode, ctx: RenderContext): any;
  renderFor(node: ForNode, ctx: RenderContext): any;
  renderNode(node: ASTNode, ctx: RenderContext): any;
}
