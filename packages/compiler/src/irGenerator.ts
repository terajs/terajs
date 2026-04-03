/**
 * @file irGenerator.ts
 * @description
 * Converts a ParsedSFC + AST into a full IRModule.
 *
 * Responsibilities:
 * - normalize template AST into IRNode[]
 * - attach source locations (if available)
 * - attach optimization flags (placeholder for future passes)
 * - merge SFC-level meta + route overrides
 *
 * This IR is renderer‑agnostic and safe for:
 * - SSR
 * - hydration
 * - routing
 * - meta systems
 * - devtools
 */

import type { ParsedSFC } from "@nebula/sfc"
import type { ASTNode } from "@nebula/renderer"
import type { IRModule, IRNode, IRFlags } from "./irTypes"
import { parseTemplateToAst } from "./parseTemplateToAst"

/**
 * Generate a full IRModule from a ParsedSFC.
 */
export function generateIRModule(sfc: ParsedSFC): IRModule {
  const ast = parseTemplateToAst(sfc.template)
  const template = ast.map(normalizeNode)

  return {
    filePath: sfc.filePath,
    template,
    meta: sfc.meta,
    ai: sfc.ai,    
    route: sfc.routeOverride
  }
}

/**
 * Normalize an AST node into an IRNode.
 * This is a deep clone with optional flags + loc.
 */
function normalizeNode(node: ASTNode): IRNode {
  const base = {
    type: node.type,
    loc: undefined,
    flags: {} as IRFlags
  };

  switch (node.type) {
    case "text":
      return {
        ...base,
        type: "text",
        value: node.value
      };

    case "interp":
      return {
        ...base,
        type: "interp",
        expression: node.expression,
        flags: { dynamic: true }
      };

    case "element":
      return {
        ...base,
        type: "element",
        tag: node.tag,
        props: node.props.map(p => ({ ...p })),
        children: node.children.map(normalizeNode),
        flags: {
          hasDirectives: node.props.some(p => p.kind === "directive")
        }
      };

    case "if":
      return {
        ...base,
        type: "if",
        condition: node.condition,
        then: node.then.map(normalizeNode),
        else: node.else?.map(normalizeNode)
      };

    case "for":
      return {
        ...base,
        type: "for",
        each: node.each,
        item: node.item,
        index: node.index,
        body: node.body.map(normalizeNode),
        flags: { hasDirectives: true }
      };
  }
}
