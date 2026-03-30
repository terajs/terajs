/**
 * A tiny YAML-like parser for Nebula SFC blocks.
 *
 * Supports:
 * - `key: value`
 * - nested objects via indentation
 * - lists using `- item`
 * - numbers, booleans, and strings
 * - no external dependencies
 *
 * This parser is intentionally minimal and designed specifically for
 * Nebula SFC++ metadata and route blocks.
 *
 * @param raw - The raw YAML-like string extracted from an SFC block.
 * @returns A parsed JavaScript object, or null if the block is empty.
 */
export function parseMiniYAML(raw: string | null): any {
  if (!raw || !raw.trim()) return null;

  const lines = raw
    .split("\n")
    .map(l => l.replace(/\r/g, ""))
    .filter(l => l.trim().length > 0);

  const root: any = {};
  const stack: any[] = [root];
  const indentStack: number[] = [0];

  const parseValue = (v: string) => {
    const trimmed = v.trim();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (!isNaN(Number(trimmed))) return Number(trimmed);
    return trimmed;
  };

  for (const line of lines) {
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const trimmed = line.trim();

    while (indent < indentStack[indentStack.length - 1]) {
      stack.pop();
      indentStack.pop();
    }

    const current = stack[stack.length - 1];

    // List item
    if (trimmed.startsWith("- ")) {
      const value = parseValue(trimmed.slice(2));

      // If the current container is NOT an array, convert the last key of the parent into an array
      if (!Array.isArray(current)) {
        const parent = stack[stack.length - 2];
        const keys = Object.keys(parent);

        // If no key exists, we cannot attach a list — create a placeholder key
        const lastKey = keys.length > 0 ? keys[keys.length - 1] : "__list";

        if (!Array.isArray(parent[lastKey])) {
          parent[lastKey] = [];
        }

        // Replace the current stack frame with the new array
        stack[stack.length - 1] = parent[lastKey];
      }

      // Now it's guaranteed to be an array
      stack[stack.length - 1].push(value);
      continue;
    }

    // Key-value pair
    const [key, ...rest] = trimmed.split(":");
    const valuePart = rest.join(":").trim();

    if (valuePart === "") {
      current[key] = {};
      stack.push(current[key]);
      indentStack.push(indent);
    } else {
      current[key] = parseValue(valuePart);
    }
  }

  return root;
}
