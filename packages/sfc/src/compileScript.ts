/**
 * @file compileScript.ts
 * @description
 * Terajs SFC script compiler (dependency‑free).
 *
 * Responsibilities:
 * - Strip a subset of TypeScript syntax
 * - Tokenize the script
 * - Scan for top‑level declarations
 * - Wrap the script in a `setup(ctx)` function
 * - Inject `props`, `slots`, `emit`
 * - Return the setup function code and exposed identifiers
 */

import { stripTypes } from "./stripTypes.js";
import { tokenizeScript, type Token } from "./tokenizeScript.js";
import { scanTopLevel } from "./scanTopLevel.js";

export interface CompiledScript {
  /**
   * The generated setup function as JavaScript code.
   */
  setupCode: string;

  /**
   * Top‑level identifiers exposed to the template compiler.
   */
  exposed: string[];

  /**
   * Top-level imported bindings available to the compiled module.
   */
  importedBindings: string[];

  /**
   * Whether this script uses createResource and should be treated as async.
   */
  hasAsyncResource: boolean;
}

interface HoistedScript {
  imports: string[];
  body: string;
}

interface IdentifierMatch {
  start: number;
  end: number;
  value: string;
}

interface VariableDeclaratorTransform {
  start: number;
  end: number;
  replacement: string;
}

function extractImportedBindings(imports: string[]): string[] {
  const bindings = new Set<string>();

  for (const statement of imports) {
    const normalized = statement.replace(/\s+/g, " ").trim().replace(/;$/, "");

    if (/^import\s+["']/.test(normalized)) {
      continue;
    }

    const fromIndex = normalized.lastIndexOf(" from ");
    const clause = fromIndex === -1
      ? normalized.replace(/^import\s+/, "").trim()
      : normalized.slice("import ".length, fromIndex).trim();

    if (!clause) {
      continue;
    }

    const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespaceMatch) {
      bindings.add(namespaceMatch[1]);
    }

    const namedMatch = clause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      for (const entry of namedMatch[1].split(",")) {
        const trimmed = entry.trim();
        if (!trimmed) {
          continue;
        }

        const aliasMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
        if (aliasMatch) {
          bindings.add(aliasMatch[2]);
          continue;
        }

        bindings.add(trimmed);
      }
    }

    const defaultClause = clause
      .replace(/\{[^}]+\}/, "")
      .replace(/\*\s+as\s+[A-Za-z_$][\w$]*/, "")
      .replace(/,/g, " ")
      .trim();

    if (/^[A-Za-z_$][\w$]*$/.test(defaultClause)) {
      bindings.add(defaultClause);
    }
  }

  return [...bindings];
}

function isIdentifierChar(value: string | undefined): boolean {
  return Boolean(value && /[A-Za-z0-9_$]/.test(value));
}

function isIdentifierStart(value: string | undefined): boolean {
  return Boolean(value && /[A-Za-z_$]/.test(value));
}

function skipStringLiteral(source: string, start: number): number {
  const quote = source[start];
  let index = start + 1;

  while (index < source.length) {
    const ch = source[index];

    if (ch === "\\") {
      index += 2;
      continue;
    }

    index += 1;
    if (ch === quote) {
      break;
    }
  }

  return index;
}

function skipLineComment(source: string, start: number): number {
  let index = start + 2;
  while (index < source.length && source[index] !== "\n") {
    index += 1;
  }
  return index;
}

function skipBlockComment(source: string, start: number): number {
  let index = start + 2;
  while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
    index += 1;
  }

  if (index < source.length) {
    index += 2;
  }

  return index;
}

function skipTrivia(source: string, start: number): number {
  let index = start;

  while (index < source.length) {
    const ch = source[index];

    if (/\s/.test(ch)) {
      index += 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index);
      continue;
    }

    if (ch === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index);
      continue;
    }

    break;
  }

  return index;
}

function readIdentifier(source: string, start: number): IdentifierMatch | null {
  const index = skipTrivia(source, start);
  if (!isIdentifierStart(source[index])) {
    return null;
  }

  let end = index + 1;
  while (isIdentifierChar(source[end])) {
    end += 1;
  }

  return {
    start: index,
    end,
    value: source.slice(index, end)
  };
}

function isWordBoundary(source: string, start: number, end: number): boolean {
  return !isIdentifierChar(source[start - 1]) && !isIdentifierChar(source[end]);
}

function matchKeyword(source: string, index: number, keyword: string): boolean {
  return source.slice(index, index + keyword.length) === keyword && isWordBoundary(source, index, index + keyword.length);
}

function findMatchingDelimiter(source: string, start: number, open: string, close: string): number {
  let depth = 0;

  for (let index = start; index < source.length; index += 1) {
    const ch = source[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index) - 1;
      continue;
    }

    if (ch === open) {
      depth += 1;
      continue;
    }

    if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function previousSignificantChar(source: string, start: number): string | null {
  let index = start - 1;

  while (index >= 0) {
    const ch = source[index];
    if (/\s/.test(ch)) {
      index -= 1;
      continue;
    }

    return ch;
  }

  return null;
}

function isLikelyStatementBreak(source: string, start: number): boolean {
  const next = skipTrivia(source, start);
  if (next >= source.length) {
    return true;
  }

  const previous = previousSignificantChar(source, start);
  if (previous && ",.?+-*/%&|^=<>:([]".includes(previous)) {
    return false;
  }

  const nextChar = source[next];
  if (nextChar === "}" || nextChar === ";") {
    return true;
  }

  if (nextChar === "," || nextChar === "." || nextChar === "?" || nextChar === ":") {
    return false;
  }

  return isIdentifierStart(nextChar) || nextChar === "{" || nextChar === "[";
}

function findStatementEnd(source: string, start: number): number {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let index = start; index < source.length; index += 1) {
    const ch = source[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index) - 1;
      continue;
    }

    if (ch === "(") {
      parenDepth += 1;
      continue;
    }

    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }

    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    if (ch === "{") {
      braceDepth += 1;
      continue;
    }

    if (ch === "}") {
      if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
        return index;
      }

      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (ch === ";" && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index + 1;
    }

    if ((ch === "\n" || ch === "\r") && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      const newlineEnd = ch === "\r" && source[index + 1] === "\n"
        ? index + 2
        : index + 1;

      if (isLikelyStatementBreak(source, newlineEnd)) {
        return newlineEnd;
      }
    }
  }

  return source.length;
}

function splitTopLevelArguments(source: string): string[] {
  const parts: string[] = [];
  let lastIndex = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const ch = source[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index) - 1;
      continue;
    }

    if (ch === "(") {
      parenDepth += 1;
      continue;
    }

    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }

    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    if (ch === "{") {
      braceDepth += 1;
      continue;
    }

    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (ch === "," && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push(source.slice(lastIndex, index));
      lastIndex = index + 1;
    }
  }

  parts.push(source.slice(lastIndex));
  return parts;
}

function hasTopLevelObjectProperty(source: string, propertyName: string): boolean {
  const trimmed = source.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return false;
  }

  let index = 1;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  while (index < trimmed.length - 1) {
    index = skipTrivia(trimmed, index);
    if (index >= trimmed.length - 1) {
      break;
    }

    const ch = trimmed[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(trimmed, index);
      continue;
    }

    if (ch === "/" && trimmed[index + 1] === "/") {
      index = skipLineComment(trimmed, index);
      continue;
    }

    if (ch === "/" && trimmed[index + 1] === "*") {
      index = skipBlockComment(trimmed, index);
      continue;
    }

    if (ch === "(") {
      parenDepth += 1;
      index += 1;
      continue;
    }

    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      index += 1;
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      index += 1;
      continue;
    }

    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      index += 1;
      continue;
    }

    if (ch === "{") {
      braceDepth += 1;
      index += 1;
      continue;
    }

    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      index += 1;
      continue;
    }

    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      const identifier = readIdentifier(trimmed, index);
      if (identifier) {
        const afterIdentifier = skipTrivia(trimmed, identifier.end);
        if (trimmed[afterIdentifier] === ":" && identifier.value === propertyName) {
          return true;
        }
        index = identifier.end;
        continue;
      }
    }

    index += 1;
  }

  return false;
}

function mergeOptionArgument(source: string, additions: Array<[string, string]>): string {
  if (additions.length === 0) {
    return source;
  }

  const trimmed = source.trim();
  const missing = additions.filter(([key]) => !hasTopLevelObjectProperty(trimmed, key));
  if (missing.length === 0) {
    return source;
  }

  const additionSource = missing.map(([key, value]) => `${key}: ${value}`).join(", ");

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const inner = trimmed.slice(1, -1).trim();
    return inner.length === 0
      ? `{ ${additionSource} }`
      : `{ ${inner}, ${additionSource} }`;
  }

  return `Object.assign({}, ${trimmed}, { ${additionSource} })`;
}

function injectCallOptions(callSource: string, calleeName: string, variableName: string, composableName: string | null): string {
  const openParenIndex = callSource.indexOf("(");
  if (openParenIndex < 0) {
    return callSource;
  }

  const closeParenIndex = findMatchingDelimiter(callSource, openParenIndex, "(", ")");
  if (closeParenIndex < 0) {
    return callSource;
  }

  const argumentSource = callSource.slice(openParenIndex + 1, closeParenIndex);
  const args = splitTopLevelArguments(argumentSource);

  let optionIndex = -1;
  const additions: Array<[string, string]> = [];

  if (calleeName === "signal" || calleeName === "ref") {
    optionIndex = 1;
    additions.push(["key", JSON.stringify(variableName)]);
    if (composableName) {
      additions.push(["composable", JSON.stringify(composableName)]);
    }
  } else if (calleeName === "reactive") {
    optionIndex = 1;
    additions.push(["group", JSON.stringify(variableName)]);
    if (composableName) {
      additions.push(["composable", JSON.stringify(composableName)]);
    }
  } else if (calleeName === "computed") {
    optionIndex = 1;
    additions.push(["key", JSON.stringify(variableName)]);
    if (composableName) {
      additions.push(["composable", JSON.stringify(composableName)]);
    }
  } else if (calleeName === "watch") {
    optionIndex = 2;
    additions.push(["debugName", JSON.stringify(variableName)]);
  } else if (calleeName === "watchEffect") {
    optionIndex = 1;
    additions.push(["debugName", JSON.stringify(variableName)]);
  } else {
    return callSource;
  }

  while (args.length < optionIndex) {
    args.push("");
  }

  if (optionIndex >= args.length || args[optionIndex].trim().length === 0) {
    args[optionIndex] = `{ ${additions.map(([key, value]) => `${key}: ${value}`).join(", ")} }`;
  } else {
    args[optionIndex] = mergeOptionArgument(args[optionIndex], additions);
  }

  return `${callSource.slice(0, openParenIndex + 1)}${args.map((arg) => arg.trim()).join(", ")}${callSource.slice(closeParenIndex)}`;
}

function findTopLevelArrowIndex(source: string, start: number, end: number): number {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let index = start; index < end - 1; index += 1) {
    const ch = source[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index) - 1;
      continue;
    }

    if (ch === "(") {
      parenDepth += 1;
      continue;
    }

    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }

    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    if (ch === "{") {
      braceDepth += 1;
      continue;
    }

    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (ch === "=" && source[index + 1] === ">" && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index;
    }
  }

  return -1;
}

function transformScriptBlock(source: string, composableName: string | null = null): string {
  const transforms: VariableDeclaratorTransform[] = [];
  let depth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const ch = source[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index) - 1;
      continue;
    }

    if (ch === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index) - 1;
      continue;
    }

    if (ch === "{") {
      depth += 1;
      continue;
    }

    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (depth !== 0) {
      continue;
    }

    if (matchKeyword(source, index, "function")) {
      const name = readIdentifier(source, index + "function".length);
      if (!name) {
        continue;
      }

      let bodyStart = name.end;
      while (bodyStart < source.length && source[bodyStart] !== "{") {
        if (source[bodyStart] === '"' || source[bodyStart] === "'" || source[bodyStart] === "`") {
          bodyStart = skipStringLiteral(source, bodyStart);
          continue;
        }

        if (source[bodyStart] === "/" && source[bodyStart + 1] === "/") {
          bodyStart = skipLineComment(source, bodyStart);
          continue;
        }

        if (source[bodyStart] === "/" && source[bodyStart + 1] === "*") {
          bodyStart = skipBlockComment(source, bodyStart);
          continue;
        }

        bodyStart += 1;
      }

      if (source[bodyStart] !== "{") {
        continue;
      }

      const bodyEnd = findMatchingDelimiter(source, bodyStart, "{", "}");
      if (bodyEnd < 0) {
        continue;
      }

      const transformedBody = transformScriptBlock(source.slice(bodyStart + 1, bodyEnd), name.value);
      transforms.push({
        start: bodyStart + 1,
        end: bodyEnd,
        replacement: transformedBody
      });
      index = bodyEnd;
      continue;
    }

    if (!(matchKeyword(source, index, "const") || matchKeyword(source, index, "let") || matchKeyword(source, index, "var"))) {
      continue;
    }

    const statementEnd = findStatementEnd(source, index);
    let cursor = index + (matchKeyword(source, index, "const") ? 5 : 3);

    while (cursor < statementEnd) {
      const declaratorName = readIdentifier(source, cursor);
      if (!declaratorName) {
        break;
      }

      let declaratorCursor = skipTrivia(source, declaratorName.end);
      if (source[declaratorCursor] !== "=") {
        cursor = declaratorCursor + 1;
        continue;
      }

      declaratorCursor = skipTrivia(source, declaratorCursor + 1);

      const asyncInitializer = matchKeyword(source, declaratorCursor, "async")
        ? readIdentifier(source, declaratorCursor + 5)
        : null;

      const functionInitializer = matchKeyword(source, declaratorCursor, "function")
        || Boolean(asyncInitializer && asyncInitializer.value === "function");

      if (functionInitializer) {
        const functionKeywordStart = matchKeyword(source, declaratorCursor, "function")
          ? declaratorCursor
          : skipTrivia(source, declaratorCursor + 5);

        let bodyStart = functionKeywordStart + "function".length;
        while (bodyStart < statementEnd && source[bodyStart] !== "{") {
          if (source[bodyStart] === '"' || source[bodyStart] === "'" || source[bodyStart] === "`") {
            bodyStart = skipStringLiteral(source, bodyStart);
            continue;
          }

          if (source[bodyStart] === "/" && source[bodyStart + 1] === "/") {
            bodyStart = skipLineComment(source, bodyStart);
            continue;
          }

          if (source[bodyStart] === "/" && source[bodyStart + 1] === "*") {
            bodyStart = skipBlockComment(source, bodyStart);
            continue;
          }

          bodyStart += 1;
        }

        const bodyEnd = source[bodyStart] === "{"
          ? findMatchingDelimiter(source, bodyStart, "{", "}")
          : -1;

        if (bodyEnd >= 0) {
          transforms.push({
            start: bodyStart + 1,
            end: bodyEnd,
            replacement: transformScriptBlock(source.slice(bodyStart + 1, bodyEnd), declaratorName.value)
          });
          cursor = bodyEnd + 1;
          continue;
        }
      }

      const directCallee = readIdentifier(source, declaratorCursor);
      const directCallOpen = directCallee ? skipTrivia(source, directCallee.end) : -1;
      if (directCallee && source[directCallOpen] === "(") {
        const callEnd = findMatchingDelimiter(source, directCallOpen, "(", ")");
        if (callEnd >= 0) {
          transforms.push({
            start: directCallee.start,
            end: callEnd + 1,
            replacement: injectCallOptions(source.slice(directCallee.start, callEnd + 1), directCallee.value, declaratorName.value, composableName)
          });
          cursor = callEnd + 1;
          continue;
        }
      }

      const arrowIndex = findTopLevelArrowIndex(source, declaratorCursor, statementEnd);
      if (arrowIndex >= 0) {
        const bodyStart = skipTrivia(source, arrowIndex + 2);
        if (source[bodyStart] === "{") {
          const bodyEnd = findMatchingDelimiter(source, bodyStart, "{", "}");
          if (bodyEnd >= 0) {
            transforms.push({
              start: bodyStart + 1,
              end: bodyEnd,
              replacement: transformScriptBlock(source.slice(bodyStart + 1, bodyEnd), declaratorName.value)
            });
            cursor = bodyEnd + 1;
            continue;
          }
        }
      }

      cursor = declaratorCursor + 1;
    }

    index = Math.max(index, statementEnd - 1);
  }

  if (transforms.length === 0) {
    return source;
  }

  transforms.sort((left, right) => left.start - right.start);

  let result = "";
  let lastIndex = 0;

  for (const transform of transforms) {
    if (transform.start < lastIndex) {
      continue;
    }

    result += source.slice(lastIndex, transform.start);
    result += transform.replacement;
    lastIndex = transform.end;
  }

  result += source.slice(lastIndex);
  return result;
}

function isTopLevelImportDeclarationStart(source: string, index: number): boolean {
  if (source.slice(index, index + 6) !== "import") {
    return false;
  }

  if (isIdentifierChar(source[index - 1]) || isIdentifierChar(source[index + 6])) {
    return false;
  }

  let cursor = index + 6;
  while (cursor < source.length && /\s/.test(source[cursor])) {
    cursor += 1;
  }

  const next = source[cursor];
  if (next === "(" || next === ".") {
    return false;
  }

  return true;
}

function readImportDeclaration(source: string, start: number): { statement: string; end: number } | null {
  let cursor = start;
  let nesting = 0;
  let sawToken = false;

  while (cursor < source.length) {
    const ch = source[cursor];

    if (ch === '"' || ch === "'" || ch === "`") {
      cursor = skipStringLiteral(source, cursor);
      sawToken = true;
      continue;
    }

    if (ch === "/" && source[cursor + 1] === "/") {
      cursor = skipLineComment(source, cursor);
      continue;
    }

    if (ch === "/" && source[cursor + 1] === "*") {
      cursor = skipBlockComment(source, cursor);
      continue;
    }

    if (!/\s/.test(ch)) {
      sawToken = true;
    }

    if (ch === "{" || ch === "(" || ch === "[") {
      nesting += 1;
      cursor += 1;
      continue;
    }

    if (ch === "}" || ch === ")" || ch === "]") {
      nesting = Math.max(0, nesting - 1);
      cursor += 1;
      continue;
    }

    if (ch === ";" && nesting === 0) {
      cursor += 1;
      break;
    }

    if ((ch === "\n" || ch === "\r") && nesting === 0 && sawToken) {
      break;
    }

    cursor += 1;
  }

  let end = cursor;
  while (end < source.length && (source[end] === " " || source[end] === "\t")) {
    end += 1;
  }

  if (source[end] === "\r" && source[end + 1] === "\n") {
    end += 2;
  } else if (source[end] === "\n" || source[end] === "\r") {
    end += 1;
  }

  const statement = source.slice(start, cursor).trim();
  if (!statement.startsWith("import")) {
    return null;
  }

  return { statement, end };
}

function hoistTopLevelImports(source: string): HoistedScript {
  const imports: string[] = [];
  const segments: string[] = [];
  let depth = 0;
  let cursor = 0;
  let segmentStart = 0;

  while (cursor < source.length) {
    const ch = source[cursor];

    if (ch === '"' || ch === "'" || ch === "`") {
      cursor = skipStringLiteral(source, cursor);
      continue;
    }

    if (ch === "/" && source[cursor + 1] === "/") {
      cursor = skipLineComment(source, cursor);
      continue;
    }

    if (ch === "/" && source[cursor + 1] === "*") {
      cursor = skipBlockComment(source, cursor);
      continue;
    }

    if (ch === "{") {
      depth += 1;
      cursor += 1;
      continue;
    }

    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      cursor += 1;
      continue;
    }

    if (depth === 0 && isTopLevelImportDeclarationStart(source, cursor)) {
      const declaration = readImportDeclaration(source, cursor);
      if (declaration) {
        segments.push(source.slice(segmentStart, cursor));
        imports.push(declaration.statement);
        cursor = declaration.end;
        segmentStart = cursor;
        continue;
      }
    }

    cursor += 1;
  }

  segments.push(source.slice(segmentStart));

  return {
    imports,
    body: segments.join("").trim()
  };
}

function hasCreateResourceCall(tokens: Token[]): boolean {
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (tokens[i].type === "identifier" && tokens[i].value === "createResource") {
      const next = tokens[i + 1];
      if (next && next.type === "punct" && next.value === "(") {
        return true;
      }
    }
  }
  return false;
}

/**
 * Compiles the raw `<script>` block into a setup function.
 *
 * @param script - Raw script content from the SFC.
 * @returns A compiled setup function and list of exposed identifiers.
 */
export function compileScript(script: string): CompiledScript {
  // 1. Strip TypeScript syntax
  const jsLike = stripTypes(script);

  // 1.5 Hoist top-level imports so setup() remains valid JavaScript.
  const { imports, body } = hoistTopLevelImports(jsLike);
  const namedBody = transformScriptBlock(body);
  const importedBindings = extractImportedBindings(imports);

  // 2. Tokenize
  const tokens = tokenizeScript(jsLike);

  // 3. Scan top‑level declarations
  const { identifiers } = scanTopLevel(tokens);

  // 4. Detect async resource usage for streaming suspension.
  const hasAsyncResource = hasCreateResourceCall(tokens);

  // 5. Wrap in a renderer-local setup function
  const setupCode = `
${imports.join("\n")}
function __ssfc(ctx) {
  const { props, slots, emit } = ctx;
  ${namedBody}
  return { ${identifiers.join(", ")} };
}
`.trim();

  return {
    setupCode,
    exposed: identifiers,
    importedBindings,
    hasAsyncResource
  };
}
