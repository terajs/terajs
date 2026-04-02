// packages/compiler/src/templateTokenizer.ts

export type TokenType =
  | "text"
  | "tagOpen"
  | "tagClose"
  | "tagSelfClose"
  | "attrName"
  | "attrValue"
  | "interp"
  | "comment";

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export function tokenizeTemplate(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const len = input.length;

  while (i < len) {
    const ch = input[i];

    // Comment: <!-- ... -->
    if (ch === "<" && input.startsWith("<!--", i)) {
      const end = input.indexOf("-->", i + 4);
      const close = end === -1 ? len : end + 3;
      tokens.push({
        type: "comment",
        value: input.slice(i + 4, end === -1 ? len : end),
        start: i,
        end: close
      });
      i = close;
      continue;
    }

    // Interpolation: {{ expr }}
    if (ch === "{" && input[i + 1] === "{") {
      const end = input.indexOf("}}", i + 2);
      const close = end === -1 ? len : end + 2;
      tokens.push({
        type: "interp",
        value: input.slice(i + 2, end === -1 ? len : end),
        start: i,
        end: close
      });
      i = close;
      continue;
    }

    // Tag open or close
    if (ch === "<") {
      const isClose = input[i + 1] === "/";
      const start = i;
      i += isClose ? 2 : 1;

      // Read tag name
      let nameStart = i;
      while (i < len && /[^\s>/]/.test(input[i])) i++;
      const tagName = input.slice(nameStart, i);

      if (!tagName) {
        i++;
        continue;
      }

      const type: TokenType = isClose ? "tagClose" : "tagOpen";
      tokens.push({ type, value: tagName, start, end: i });

      // Attributes for open tags
      if (!isClose) {
        while (i < len) {
          // Skip whitespace
          while (i < len && /\s/.test(input[i])) i++;

          if (input[i] === "/" && input[i + 1] === ">") {
            tokens.push({
              type: "tagSelfClose",
              value: "/>",
              start: i,
              end: i + 2
            });
            i += 2;
            break;
          }

          if (input[i] === ">") {
            i++;
            break;
          }

          // Attribute name
          const attrStart = i;
          while (i < len && /[^\s=/>]/.test(input[i])) i++;
          const attrName = input.slice(attrStart, i);
          if (!attrName) break;

          tokens.push({
            type: "attrName",
            value: attrName,
            start: attrStart,
            end: i
          });

          // Skip whitespace
          while (i < len && /\s/.test(input[i])) i++;

          // Optional = value
          if (input[i] === "=") {
            i++;
            while (i < len && /\s/.test(input[i])) i++;

            let value = "";
            let valStart = i;

            const quote = input[i];
            if (quote === `"` || quote === `'`) {
              i++;
              valStart = i;
              const endQuote = input.indexOf(quote, i);
              const endPos = endQuote === -1 ? len : endQuote;
              value = input.slice(valStart, endPos);
              i = endQuote === -1 ? len : endQuote + 1;
            } else {
              while (i < len && /[^\s>]/.test(input[i])) i++;
              value = input.slice(valStart, i);
            }

            tokens.push({
              type: "attrValue",
              value,
              start: valStart,
              end: i
            });
          }
        }
      } else {
        // Skip until '>'
        while (i < len && input[i] !== ">") i++;
        if (input[i] === ">") i++;
      }

      continue;
    }

    // Text
    const next = findNextSpecial(input, i);
    const text = input.slice(i, next);
    if (text) {
      tokens.push({
        type: "text",
        value: text,
        start: i,
        end: next
      });
    }
    i = next;
  }

  return tokens;
}

function findNextSpecial(input: string, start: number): number {
  const idxs = [
    input.indexOf("<", start),
    input.indexOf("{{", start),
    input.indexOf("<!--", start)
  ].filter((i) => i !== -1);
  return idxs.length ? Math.min(...idxs) : input.length;
}
