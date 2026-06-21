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

  return rewriteCssBlocks(css, attr);
}

function rewriteCssBlocks(css: string, attr: string, insideKeyframes = false): string {
  let output = "";
  let cursor = 0;

  while (cursor < css.length) {
    const openBrace = css.indexOf("{", cursor);
    if (openBrace === -1) {
      output += css.slice(cursor);
      break;
    }

    const closeBrace = findMatchingBrace(css, openBrace);
    if (closeBrace === -1) {
      output += css.slice(cursor);
      break;
    }

    const prelude = css.slice(cursor, openBrace);
    const body = css.slice(openBrace + 1, closeBrace);
    const selector = prelude.trim();
    const leadingWhitespace = prelude.slice(0, prelude.indexOf(selector));

    if (selector.startsWith("@")) {
      const atRuleName = selector.match(/^@([\w-]+)/)?.[1]?.toLowerCase() ?? "";
      const isKeyframes = atRuleName.endsWith("keyframes");
      const shouldRewriteNestedRules = isScopedGroupAtRule(atRuleName) && !insideKeyframes;
      const nextBody = shouldRewriteNestedRules
        ? rewriteCssBlocks(body, attr, isKeyframes)
        : body;

      output += `${leadingWhitespace}${selector} {${nextBody}}`;
    } else if (insideKeyframes) {
      output += `${prelude}{${body}}`;
    } else {
      output += `${leadingWhitespace}${scopeSelectorList(selector, attr)} {${body}}`;
    }

    cursor = closeBrace + 1;
  }

  return output;
}

function isScopedGroupAtRule(name: string): boolean {
  return name === "media" || name === "supports" || name === "container" || name === "layer";
}

function scopeSelectorList(selectorText: string, attr: string): string {
  return splitSelectorList(selectorText)
    .map((selector) => scopeSelector(selector.trim(), attr))
    .filter(Boolean)
    .join(", ");
}

function scopeSelector(selector: string, attr: string): string {
  if (selector.length === 0 || selector.includes(attr)) {
    return selector;
  }

  const parts = selector.split(/\s+/);
  const last = parts.pop()!;
  return [...parts, `${last}${attr}`].join(" ");
}

function splitSelectorList(selectorText: string): string[] {
  const selectors: string[] = [];
  let current = "";
  let depth = 0;

  for (let index = 0; index < selectorText.length; index += 1) {
    const char = selectorText[index];

    if (char === "(" || char === "[" || char === "{") {
      depth += 1;
    } else if (char === ")" || char === "]" || char === "}") {
      depth = Math.max(0, depth - 1);
    }

    if (char === "," && depth === 0) {
      selectors.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  selectors.push(current);
  return selectors;
}

function findMatchingBrace(css: string, openBrace: number): number {
  let depth = 0;
  let quote: string | null = null;

  for (let index = openBrace; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];

    if (quote) {
      if (char === "\\" && next) {
        index += 1;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === "/" && next === "*") {
      const commentEnd = css.indexOf("*/", index + 2);
      if (commentEnd === -1) {
        return -1;
      }

      index = commentEnd + 1;
      continue;
    }

    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}
