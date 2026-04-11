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

/** Base AST node type. */
export type ASTNode =
  | ElementNode
  | PortalNode
  | SlotNode
  | TextNode
  | InterpolationNode
  | IfNode
  | ForNode;

/**
 * A plain text node.
 */
export interface TextNode {
  type: "text";
  value: string;
}

/**
 * A dynamic expression inside {{ }}.
 */
export interface InterpolationNode {
  type: "interp";
  expression: string;
}

/**
 * A static or dynamic property on an element.
 */
export interface PropNode {
  name: string;
  value: string;
  kind: "static" | "bind" | "event" | "directive";
}

/**
 * A standard HTML-like element node.
 */
export interface ElementNode {
  type: "element";
  tag: string;
  props: PropNode[];
  children: ASTNode[];
}

/**
 * A portal node.
 */
export interface PortalNode {
  type: "portal";
  target?: PropNode;
  children: ASTNode[];
}

/**
 * A slot outlet node.
 */
export interface SlotNode {
  type: "slot";
  name?: string;
  fallback: ASTNode[];
}

/**
 * Conditional rendering node.
 */
export interface IfNode {
  type: "if";
  condition: string;
  then: ASTNode[];
  else?: ASTNode[];
}

/**
 * Loop node for rendering lists.
 */
export interface ForNode {
  type: "for";
  each: string;
  item: string;
  index?: string;
  body: ASTNode[];
}
