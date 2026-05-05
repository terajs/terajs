import {
  findMatchingDelimiter,
  matchKeyword,
  readIdentifier,
  skipBlockComment,
  skipLineComment,
  skipStringLiteral,
  skipTrivia,
} from "./compileScriptLexing.js";
import { findStatementEnd, findTopLevelArrowIndex, injectCallOptions } from "./compileScriptStatementUtils.js";

interface VariableDeclaratorTransform {
  start: number;
  end: number;
  replacement: string;
}

export function transformScriptBlock(source: string, composableName: string | null = null): string {
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