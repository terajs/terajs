/**
 * @file compileStyle.ts
 * @description
 * Compiles the <style> block of a ParsedSFC into final CSS,
 * applying scoped rewriting when needed.
 */
import { rewriteScopedCss } from "./rewriteScopedCss.js";
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
export function compileStyle(sfc, scopeId) {
    if (!sfc.style)
        return null;
    const styleObj = typeof sfc.style === "string"
        ? { content: sfc.style }
        : sfc.style;
    const rawCss = styleObj.content ?? "";
    const lang = styleObj.lang;
    const scoped = !!styleObj.scoped;
    let css = rawCss;
    if (scoped && scopeId) {
        css = rewriteScopedCss(css, scopeId);
    }
    return {
        css,
        lang,
        scoped,
        scopeId
    };
}
