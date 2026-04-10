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
export function rewriteScopedCss(css: string, scopeId: string): string {
  const attr = `[data-${scopeId}]`;

  return css.replace(
    /([^{]+)\{/g,
    (_fullMatch: string, selectorPart: string) => {
      const selectors = selectorPart
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(sel => {
          // Ignore at-rules like @media, @keyframes, etc.
          if (sel.startsWith("@")) return sel;

          // If already scoped, leave it alone
          if (sel.includes(attr)) return sel;

          // Attach attribute to the last simple selector
          // e.g. "div .btn" → "div .btn[data-scope]"
          const parts = sel.split(/\s+/);
          const last = parts.pop()!;
          const scopedLast = `${last}${attr}`;
          return [...parts, scopedLast].join(" ");
        });

      return `${selectors.join(", ")} {`;
    }
  );
}
