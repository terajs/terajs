export interface IdentifierMatch {
  start: number;
  end: number;
  value: string;
}

export function isIdentifierChar(value: string | undefined): boolean {
  return Boolean(value && /[A-Za-z0-9_$]/.test(value));
}

export function isIdentifierStart(value: string | undefined): boolean {
  return Boolean(value && /[A-Za-z_$]/.test(value));
}

export function skipStringLiteral(source: string, start: number): number {
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

export function skipLineComment(source: string, start: number): number {
  let index = start + 2;
  while (index < source.length && source[index] !== "\n") {
    index += 1;
  }
  return index;
}

export function skipBlockComment(source: string, start: number): number {
  let index = start + 2;
  while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
    index += 1;
  }

  if (index < source.length) {
    index += 2;
  }

  return index;
}

export function skipTrivia(source: string, start: number): number {
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

export function readIdentifier(source: string, start: number): IdentifierMatch | null {
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

export function isWordBoundary(source: string, start: number, end: number): boolean {
  return !isIdentifierChar(source[start - 1]) && !isIdentifierChar(source[end]);
}

export function matchKeyword(source: string, index: number, keyword: string): boolean {
  return source.slice(index, index + keyword.length) === keyword && isWordBoundary(source, index, index + keyword.length);
}

export function findMatchingDelimiter(source: string, start: number, open: string, close: string): number {
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