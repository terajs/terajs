import {
  findMatchingDelimiter,
  isIdentifierStart,
  matchKeyword,
  readIdentifier,
  skipBlockComment,
  skipLineComment,
  skipStringLiteral,
  skipTrivia,
} from "./compileScriptLexing.js";

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

export function findStatementEnd(source: string, start: number): number {
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

export function injectCallOptions(callSource: string, calleeName: string, variableName: string, composableName: string | null): string {
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

export function findTopLevelArrowIndex(source: string, start: number, end: number): number {
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