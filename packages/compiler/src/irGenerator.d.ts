/**
 * @file irGenerator.ts
 * @description
 * Converts a ParsedSFC + AST into a full IRModule.
 * Adds support for scoped styles by generating a stable scopeId
 * and injecting a data attribute into every element IR node.
 */
import type { IRModule } from "./irTypes.js";
import type { ParsedSFC } from "./sfcTypes.js";
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
export declare function generateIRModule(sfc: ParsedSFC): IRModule;
//# sourceMappingURL=irGenerator.d.ts.map