/**
 * @file parseMiniYAML.ts
 * @description
 * A tiny, zero-dependency YAML-like parser for Terajs SFC++ metadata and route blocks.
 * Emits debug events to the Terajs DevTools substrate for real-time error reporting.
 */

import { Debug } from "@terajs/shared";

/**
 * A tiny YAML-like parser for Terajs SFC blocks.
 * * Supports:
 * - `key: value` pairs
 * - Nested objects via indentation
 * - Lists using `- item`
 * - Automatic type inference (numbers, booleans, strings)
 * * @param raw - The raw YAML-like string extracted from an SFC block.
 * @returns A parsed JavaScript object, or null if the block is empty or invalid.
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

  /**
   * Internal helper to cast strings to native JS types.
   */
  const parseValue = (v: string) => {
    const trimmed = v.trim();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (!isNaN(Number(trimmed)) && trimmed !== "") return Number(trimmed);
    return trimmed;
  };

  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.match(/^\s*/)?.[0].length ?? 0;
      const trimmed = line.trim();

      // Handle dedenting: Pop from stack until we match the current indentation level
      while (indent < indentStack[indentStack.length - 1]) {
        stack.pop();
        indentStack.pop();
      }

      const current = stack[stack.length - 1];

      // --- List Item Handling ---
      if (trimmed.startsWith("- ")) {
        const value = parseValue(trimmed.slice(2));

        // If current container isn't an array, we need to convert the parent's last key
        if (!Array.isArray(current)) {
          const parent = stack[stack.length - 2];
          if (!parent) {
            throw new Error(`Orphaned list item found at line ${i + 1}`);
          }
          
          const keys = Object.keys(parent);
          const lastKey = keys.length > 0 ? keys[keys.length - 1] : "__list";

          if (!Array.isArray(parent[lastKey])) {
            parent[lastKey] = [];
          }

          // Swap the current stack frame to the array
          stack[stack.length - 1] = parent[lastKey];
        }

        stack[stack.length - 1].push(value);
        continue;
      }

      // --- Key-Value Handling ---
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex === -1) {
        throw new Error(`Invalid syntax: Missing colon at line ${i + 1}`);
      }

      const key = trimmed.slice(0, colonIndex).trim();
      const valuePart = trimmed.slice(colonIndex + 1).trim();

      if (valuePart === "") {
        // Nested object start
        current[key] = {};
        stack.push(current[key]);
        indentStack.push(indent);
      } else {
        // Leaf value
        current[key] = parseValue(valuePart);
      }
    }

    return root;
  } catch (error: any) {
    /**
     * Emit to the Terajs DevTools. 
     * This allows the SFC Inspector to show exactly what went wrong.
     */
    Debug.emit("error:template", {
      phase: "sfc:yaml-parse",
      message: error.message,
      source: raw
    });
    
    return null;
  }
}
