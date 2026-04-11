/**
 * @file tokenizeScript.ts
 * @description
 * Tiny tokenizer for Terajs script analysis.
 *
 * We only care about:
 * - identifiers
 * - keywords (import, const, let, var, function, class)
 * - basic punctuation
 *
 * We explicitly do NOT fully parse JS. This is a lightweight tokenizer
 * to support top‑level scanning.
 */

export type TokenType =
  | "identifier"
  | "keyword"
  | "string"
  | "punct"
  | "eof";

export interface Token {
  type: TokenType;
  value: string;
  index: number;
}

/**
 * Keywords we care about for top‑level analysis.
 */
const KEYWORDS = new Set([
  "import",
  "const",
  "let",
  "var",
  "function",
  "class",
  "export"
]);

/**
 * Tokenizes a script into a flat list of tokens.
 *
 * @param source - JS/TS source code.
 * @returns An array of tokens.
 */
export function tokenizeScript(source: string): Token[] {
  const tokens: Token[] = [];
  const length = source.length;
  let i = 0;

  const isAlpha = (ch: string) => /[A-Za-z_$]/.test(ch);
  const isAlnum = (ch: string) => /[A-Za-z0-9_$]/.test(ch);
  const isWhitespace = (ch: string) => /\s/.test(ch);

  while (i < length) {
    const ch = source[i];

    // Whitespace
    if (isWhitespace(ch)) {
      i++;
      continue;
    }

    // Line comment
    if (ch === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < length && source[i] !== "\n") i++;
      continue;
    }

    // Block comment
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    // String literal (simple)
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      let value = ch;
      i++;
      while (i < length) {
        const c = source[i];
        value += c;
        i++;
        if (c === "\\" && i < length) {
          value += source[i];
          i++;
          continue;
        }
        if (c === quote) break;
      }
      tokens.push({ type: "string", value, index: i });
      continue;
    }

    // Identifier / keyword
    if (isAlpha(ch)) {
      let value = ch;
      i++;
      while (i < length && isAlnum(source[i])) {
        value += source[i];
        i++;
      }
      const type: TokenType = KEYWORDS.has(value) ? "keyword" : "identifier";
      tokens.push({ type, value, index: i });
      continue;
    }

    // Punctuation (we only care about a few)
    if ("{}();,=".includes(ch)) {
      tokens.push({ type: "punct", value: ch, index: i });
      i++;
      continue;
    }

    // Fallback: skip unknown char
    i++;
  }

  tokens.push({ type: "eof", value: "", index: length });
  return tokens;
}
