/**
 * @file irTypes.ts
 * @description
 * Core Intermediate Representation (IR) types for Terajs's compiler.
 *
 * Terajs's IR is intentionally renderer-agnostic. It represents:
 * - normalized template structure
 * - metadata extracted from <meta> blocks
 * - route overrides extracted from <route> blocks
 * - file-level context for SSR, hydration, routing, and devtools
 *
 * This IR is the foundation for:
 * - SSR codegen
 * - client-side DOM codegen
 * - routing + meta transforms
 * - AI-assisted analysis
 * - static optimization passes
 */

import type { MetaConfig, RouteOverride } from "./sfcTypes.js"

/**
 * IR flags used for static analysis and optimization.
 */
export interface IRFlags {
  /** Whether this node contains dynamic bindings. */
  dynamic?: boolean

  /** Whether this node is fully static and can be hoisted. */
  static?: boolean

  /** Whether this node contains directives (v-if, v-for, etc.). */
  hasDirectives?: boolean
}

/**
 * Base shape shared by all IR nodes.
 */
export interface IRNodeBase {
  /** Discriminant for the node kind. */
  type: string

  /** Optional source location for devtools + error overlays. */
  loc?: { start: number; end: number }

  /** Optional optimization flags. */
  flags?: IRFlags
}

/**
 * Text node in IR.
 */
export interface IRTextNode extends IRNodeBase {
  type: "text"
  value: string
}

/**
 * Neutral binding hint for common expression shapes the compiler can classify.
 */
export interface IRBindingHint {
  kind: "simple-path"
  segments: string[]
}

/**
 * Interpolation node in IR (e.g. {{ expr }}).
 */
export interface IRInterpolationNode extends IRNodeBase {
  type: "interp"
  expression: string
  binding?: IRBindingHint
}

/**
 * Element node in IR.
 */
export interface IRElementNode extends IRNodeBase {
  type: "element"
  tag: string
  props: IRPropNode[]
  children: IRNode[]
}

/**
 * Portal node in IR.
 */
export interface IRPortalNode extends IRNodeBase {
  type: "portal"
  target?: IRPropNode
  children: IRNode[]
}

/**
 * Slot outlet node in IR.
 */
export interface IRSlotNode extends IRNodeBase {
  type: "slot"
  name?: string
  fallback: IRNode[]
}

/**
 * v-if node in IR.
 */
export interface IRIfNode extends IRNodeBase {
  type: "if"
  condition: string
  then: IRNode[]
  else?: IRNode[]
}

/**
 * v-for node in IR.
 */
export interface IRForNode extends IRNodeBase {
  type: "for"
  isStructural?: boolean // Indicates if this node should be treated as a structural directive
  each: string
  item: string
  index?: string
  body: IRNode[]
}

/**
 * Prop node in IR (static, bind, event, directive, etc.).
 * This can be refined later as needed.
 */
export interface IRPropNode {
  kind: "static" | "bind" | "event" | "directive" | string
  name: string
  value: unknown
  binding?: IRBindingHint
}

/**
 * Discriminated union of all IR node kinds.
 */
export type IRNode =
  | IRTextNode
  | IRInterpolationNode
  | IRElementNode
  | IRPortalNode
  | IRSlotNode
  | IRIfNode
  | IRForNode

/**
 * The full IR module produced from a Terajs SFC++ file.
 *
 * This is the compiler's primary output and the input to:
 * - SSR renderer
 * - DOM renderer
 * - router
 * - ai metadata system
 * - meta system
 * - devtools
 */
export interface IRModule {
  /** Absolute or project-relative file path of the SFC. */
  filePath: string;

  /** Normalized template IR nodes. */
  template: IRNode[];

  /** Parsed metadata from the <meta> block. */
  meta: MetaConfig;

  /** Parsed AI metadata from the <ai> block, if present. Instructional-only metadata only. */
  ai?: Record<string, any>;

  /** Parsed route overrides from the <route> block, if present. */
  route: RouteOverride | null;

  /** Whether this IR module contains async resource loading. */
  hasAsyncResource?: boolean;

  scopeId?: string; // For scoped styles, if needed
}


