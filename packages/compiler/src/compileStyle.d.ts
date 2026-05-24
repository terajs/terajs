/**
 * @file compileStyle.ts
 * @description
 * Compiles the <style> block of a ParsedSFC into final CSS,
 * applying scoped rewriting when needed.
 */
import type { ParsedSFC } from "./sfcTypes.js";
/**
 * Result of compiling an SFC style block.
 */
export interface CompiledStyle {
    /** Final CSS string after any transforms (scoped, preprocess, etc.). */
    css: string;
    /** Optional language hint (e.g. "scss", "less"). */
    lang?: string;
    /** Whether this style was scoped. */
    scoped: boolean;
    /** Optional scope identifier used for scoping. */
    scopeId?: string;
}
/**
 * Compiles the <style> block of a ParsedSFC into final CSS.
 *
 * Responsibilities:
 * - Handle missing style blocks
 * - Respect style.lang (for future preprocessors)
 * - Apply scoped CSS rewriting when sfc.style.scoped is true
 *
 * @param sfc - Parsed SFC
 * @param scopeId - Optional scope identifier from IRModule
 * @returns A CompiledStyle object, or null if no style block exists.
 */
export declare function compileStyle(sfc: ParsedSFC, scopeId?: string): CompiledStyle | null;
//# sourceMappingURL=compileStyle.d.ts.map