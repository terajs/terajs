/**
 * @file irGenerator.ts
 * @description
 * Converts a ParsedSFC + AST into a full IRModule.
 * Adds support for scoped styles by generating a stable scopeId
 * and injecting a data attribute into every element IR node.
 */

import type { ASTNode } from "@terajs/renderer";
import type { IRModule, IRNode, IRFlags } from "./irTypes";
import { parseTemplateToAst } from "./parseTemplateToAst";
import type { ParsedSFC } from "./sfcTypes";

/**
 * Tiny deterministic hash for generating scope IDs.
 * Produces short, stable base36 strings.
 *
 * This is intentionally simple and avoids external dependencies.
 * It is stable across builds and environments.
 *
 * @param input - Any string, typically the SFC file path.
 * @returns A short base36 hash string.
 */
function hash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0; // Convert to 32-bit integer
  }
  return Math.abs(h).toString(36);
}

/**
 * Generates a full IRModule from a ParsedSFC.
 *
 * Responsibilities:
 * - Normalize template into AST -> IR
 * - Attach metadata, AI config, and route overrides
 * - Detect scoped styles and generate a stable scopeId
 * - Pass scopeId into IR node normalization so elements receive data-scope attributes
 *
 * @param sfc - Parsed SFC structure from parseSFC()
 * @returns A complete IRModule ready for rendering or compilation.
 */
export function generateIRModule(sfc: ParsedSFC): IRModule {
  // Normalize template into a string
  const templateSource =
    typeof sfc.template === "string"
      ? sfc.template
      : sfc.template?.content ?? "";

  // Parse template into AST
  const ast = parseTemplateToAst(templateSource);

  // Determine scopeId if <style scoped> was used
  let scopeId: string | undefined = undefined;

  if (
    sfc.style &&
    typeof sfc.style !== "string" &&
    sfc.style.scoped
  ) {
    // Stable hash based on file path
    scopeId = `tera-${hash(sfc.filePath)}`;
  }

  // Convert AST -> IR, injecting scopeId into element nodes
  const template = ast.map(node => normalizeNode(node, scopeId));

  return {
    filePath: sfc.filePath,
    template,
    meta: sfc.meta,
    ai: sfc.ai,
    route: sfc.routeOverride,
    scopeId
  };
}

/**
 * Normalizes an ASTNode into an IRNode.
 *
 * If a scopeId is provided, every element node receives a
 * `data-${scopeId}` attribute to support scoped CSS.
 *
 * @param node - AST node from the template parser
 * @param scopeId - Optional scoped style identifier
 * @returns A normalized IRNode
 */
function normalizeNode(node: ASTNode, scopeId?: string): IRNode {
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

    case "element": {
      // Copy props from AST
      const props = node.props.map(p => ({ ...p }));

      // Inject scoped style attribute
      if (scopeId) {
        props.push({
          kind: "static",
          name: `data-${scopeId}`,
          value: ""
        });
      }

      return {
        ...base,
        type: "element",
        tag: node.tag,
        props,
        children: node.children.map(child =>
          normalizeNode(child, scopeId)
        ),
        flags: {
          hasDirectives: node.props.some(p => p.kind === "directive")
        }
      };
    }

    case "portal":
      return {
        ...base,
        type: "portal",
        target: node.target ? { ...node.target } : undefined,
        children: node.children.map((child) => normalizeNode(child, scopeId)),
        flags: {
          dynamic: node.target?.kind === "bind"
        }
      };

    case "slot":
      return {
        ...base,
        type: "slot",
        name: node.name,
        fallback: node.fallback.map((child) => normalizeNode(child, scopeId)),
        flags: { dynamic: true }
      };

    case "if":
      return {
        ...base,
        type: "if",
        condition: node.condition,
        then: node.then.map(n => normalizeNode(n, scopeId)),
        else: node.else?.map(n => normalizeNode(n, scopeId))
      };

    case "for":
      return {
        ...base,
        type: "for",
        each: node.each,
        item: node.item,
        index: node.index,
        body: node.body.map(n => normalizeNode(n, scopeId)),
        flags: { hasDirectives: true }
      };
  }
}

