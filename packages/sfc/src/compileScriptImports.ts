import {
  isIdentifierChar,
  skipBlockComment,
  skipLineComment,
  skipStringLiteral,
} from "./compileScriptLexing.js";

export interface HoistedScript {
  imports: string[];
  body: string;
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

export function hoistTopLevelImports(source: string): HoistedScript {
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