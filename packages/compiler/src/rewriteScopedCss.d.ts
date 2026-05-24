/**
 * @file rewriteScopedCss.ts
 * @description
 * Rewrites CSS selectors to apply Terajs's scoped style attribute.
 *
 * Example:
 *   .btn { color: red; }
 *   → .btn[data-tera-abc123] { color: red; }
 *
 * This is intentionally simple and avoids a full CSS parser.
 * It handles the majority of real‑world selectors well and is
 * easy to replace with a more advanced parser later.
 */
/**
 * Rewrites all CSS selectors in a <style scoped> block so they
 * only apply to elements carrying the given scopeId.
 *
 * @param css - Raw CSS string from the SFC <style> block
 * @param scopeId - The generated scope identifier (e.g. "tera-abc123")
 * @returns Scoped CSS string
 */
export declare function rewriteScopedCss(css: string, scopeId: string): string;
//# sourceMappingURL=rewriteScopedCss.d.ts.map