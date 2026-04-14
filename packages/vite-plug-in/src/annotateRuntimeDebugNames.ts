function isIdentifierBoundary(value: string | undefined): boolean {
  return !value || !/[A-Za-z0-9_$]/.test(value);
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

  return index < source.length ? index + 2 : index;
}

function skipWhitespaceAndComments(source: string, start: number): number {
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

function readIdentifier(source: string, start: number): string | null {
  const first = source[start];
  if (!first || !/[A-Za-z_$]/.test(first)) {
    return null;
  }

  let index = start + 1;
  while (index < source.length && /[A-Za-z0-9_$]/.test(source[index])) {
    index += 1;
  }

  return source.slice(start, index);
}

function findMatchingParen(source: string, start: number): number {
  let index = start;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  while (index < source.length) {
    const ch = source[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(source, index);
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

    if (ch === "(") {
      parenDepth += 1;
    } else if (ch === ")") {
      parenDepth -= 1;
      if (parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
        return index;
      }
    } else if (ch === "{") {
      braceDepth += 1;
    } else if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
    } else if (ch === "[") {
      bracketDepth += 1;
    } else if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
    }

    index += 1;
  }

  return -1;
}

function splitTopLevelArguments(source: string): string[] {
  const args: string[] = [];
  let cursor = 0;
  let index = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  while (index < source.length) {
    const ch = source[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(source, index);
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

    if (ch === "(") {
      parenDepth += 1;
    } else if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (ch === "{") {
      braceDepth += 1;
    } else if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
    } else if (ch === "[") {
      bracketDepth += 1;
    } else if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
    } else if (ch === "," && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      args.push(source.slice(cursor, index).trim());
      cursor = index + 1;
    }

    index += 1;
  }

  const tail = source.slice(cursor).trim();
  if (tail.length > 0) {
    args.push(tail);
  }

  return args;
}

function readVariableKeyword(source: string, start: number): "const" | "let" | "var" | null {
  for (const keyword of ["const", "let", "var"] as const) {
    if (source.slice(start, start + keyword.length) !== keyword) {
      continue;
    }

    if (!isIdentifierBoundary(source[start - 1]) || !isIdentifierBoundary(source[start + keyword.length])) {
      continue;
    }

    return keyword;
  }

  return null;
}

function readRuntimeCallName(source: string, start: number): "computed" | "watch" | "watchEffect" | null {
  for (const name of ["watchEffect", "computed", "watch"] as const) {
    if (source.slice(start, start + name.length) !== name) {
      continue;
    }

    if (!isIdentifierBoundary(source[start - 1]) || !isIdentifierBoundary(source[start + name.length])) {
      continue;
    }

    return name;
  }

  return null;
}

function extractWatchSourceExpression(sourceArg: string): string | null {
  const trimmed = sourceArg.trim();
  const arrowIndex = trimmed.indexOf("=>");
  if (arrowIndex === -1) {
    return null;
  }

  let expression = trimmed.slice(arrowIndex + 2).trim();
  if (expression.startsWith("{")) {
    const blockMatch = expression.match(/^\{\s*return\s+([\s\S]*?);?\s*\}$/);
    expression = blockMatch?.[1]?.trim() ?? "";
  }

  return expression.length > 0 ? expression : null;
}

function deriveWatchSourceName(sourceArg: string): string | null {
  const expression = extractWatchSourceExpression(sourceArg);
  if (!expression) {
    return null;
  }

  const normalized = expression
    .replace(/^return\s+/, "")
    .replace(/[;]+$/, "")
    .replace(/(?:\?\.|\.)(?:value|get\(\))$/, "")
    .replace(/\(\)$/, "")
    .trim();

  if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(normalized)) {
    return null;
  }

  const segments = normalized.split(".");
  return segments[segments.length - 1] ?? null;
}

function injectDebugOptions(callSource: string, optionEntry: string): string {
  const closeIndex = callSource.lastIndexOf(")");
  if (closeIndex === -1) {
    return callSource;
  }

  const beforeClose = callSource.slice(0, closeIndex);
  const trailingWhitespace = beforeClose.match(/\s*$/)?.[0] ?? "";
  const content = beforeClose.slice(0, beforeClose.length - trailingWhitespace.length);
  const separator = content.trimEnd().endsWith("(") ? "" : ", ";
  return `${content}${separator}{ ${optionEntry} }${trailingWhitespace}${callSource.slice(closeIndex)}`;
}

function annotateNamedRuntimeCall(callName: "computed" | "watch" | "watchEffect", bindingName: string, callSource: string): string {
  const openIndex = callSource.indexOf("(");
  const closeIndex = callSource.lastIndexOf(")");
  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
    return callSource;
  }

  const args = splitTopLevelArguments(callSource.slice(openIndex + 1, closeIndex));

  if (callName === "computed") {
    if (args.length >= 2) {
      return callSource;
    }

    return injectDebugOptions(callSource, `key: ${JSON.stringify(bindingName)}`);
  }

  if (callName === "watchEffect") {
    if (args.length >= 2) {
      return callSource;
    }

    return injectDebugOptions(callSource, `debugName: ${JSON.stringify(bindingName)}`);
  }

  if (args.length >= 3) {
    return callSource;
  }

  const sourceName = deriveWatchSourceName(args[0] ?? "");
  if (!sourceName) {
    return callSource;
  }

  return injectDebugOptions(callSource, `debugName: ${JSON.stringify(sourceName)}`);
}

interface NamedRuntimeDeclaration {
  bindingName: string;
  callName: "computed" | "watch" | "watchEffect";
  callStart: number;
  callEnd: number;
  callSource: string;
}

function readNamedRuntimeDeclaration(source: string, start: number): NamedRuntimeDeclaration | null {
  const keyword = readVariableKeyword(source, start);
  if (!keyword) {
    return null;
  }

  let cursor = skipWhitespaceAndComments(source, start + keyword.length);
  const bindingName = readIdentifier(source, cursor);
  if (!bindingName) {
    return null;
  }

  cursor += bindingName.length;
  cursor = skipWhitespaceAndComments(source, cursor);
  if (source[cursor] !== "=") {
    return null;
  }

  cursor += 1;
  cursor = skipWhitespaceAndComments(source, cursor);

  const callName = readRuntimeCallName(source, cursor);
  if (!callName) {
    return null;
  }

  let callCursor = cursor + callName.length;
  callCursor = skipWhitespaceAndComments(source, callCursor);
  if (source[callCursor] !== "(") {
    return null;
  }

  const closeIndex = findMatchingParen(source, callCursor);
  if (closeIndex === -1) {
    return null;
  }

  return {
    bindingName,
    callName,
    callStart: cursor,
    callEnd: closeIndex + 1,
    callSource: source.slice(cursor, closeIndex + 1)
  };
}

export function annotateRuntimeDebugNames(source: string): string {
  if (!source.trim()) {
    return source;
  }

  let result = "";
  let cursor = 0;
  let index = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  while (index < source.length) {
    const ch = source[index];

    if (ch === '"' || ch === "'" || ch === "`") {
      index = skipStringLiteral(source, index);
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

    if (parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      const declaration = readNamedRuntimeDeclaration(source, index);
      if (declaration) {
        const nextCall = annotateNamedRuntimeCall(declaration.callName, declaration.bindingName, declaration.callSource);
        if (nextCall !== declaration.callSource) {
          result += source.slice(cursor, declaration.callStart);
          result += nextCall;
          cursor = declaration.callEnd;
        }

        index = declaration.callEnd;
        continue;
      }
    }

    if (ch === "(") {
      parenDepth += 1;
    } else if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (ch === "{") {
      braceDepth += 1;
    } else if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
    } else if (ch === "[") {
      bracketDepth += 1;
    } else if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
    }

    index += 1;
  }

  return result + source.slice(cursor);
}