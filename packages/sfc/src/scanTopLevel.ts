/**
 * @file scanTopLevel.ts
 * @description
 * Scans tokenized script to find top‑level declarations:
 * - const / let / var
 * - function declarations
 * - class declarations
 *
 * This is a shallow, top‑level‑only scanner. It does not descend into
 * nested blocks or expressions.
 */

import type { Token } from "./tokenizeScript.js";

export interface TopLevelScanResult {
  identifiers: string[];
}

/**
 * Scans tokens for top‑level declarations and collects identifier names.
 *
 * @param tokens - Token stream from `tokenizeScript`.
 * @returns A list of top‑level identifiers.
 */
export function scanTopLevel(tokens: Token[]): TopLevelScanResult {
  const identifiers: string[] = [];
  const len = tokens.length;
  let i = 0;
  let depth = 0;

  const at = (offset = 0) => tokens[i + offset] ?? tokens[len - 1];

  while (i < len) {
    const tok = tokens[i];

    if (tok.type === "punct") {
      if (tok.value === "{") depth++;
      if (tok.value === "}") depth = Math.max(0, depth - 1);
      i++;
      continue;
    }

    // Only care about depth 0 (top‑level)
    if (depth === 0 && tok.type === "keyword") {
      // const / let / var
      if (tok.value === "const" || tok.value === "let" || tok.value === "var") {
        // pattern: const IDENT =
        const next = at(1);
        if (next.type === "identifier") {
          identifiers.push(next.value);
        }
      }

      // function IDENT(...)
      if (tok.value === "function") {
        const next = at(1);
        if (next.type === "identifier") {
          identifiers.push(next.value);
        }
      }

      // class IDENT ...
      if (tok.value === "class") {
        const next = at(1);
        if (next.type === "identifier") {
          identifiers.push(next.value);
        }
      }
    }

    i++;
  }

  return { identifiers };
}
