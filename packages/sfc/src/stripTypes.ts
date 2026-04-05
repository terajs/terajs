/**
 * @file stripTypes.ts
 * @description
 * Very small, dependency‑free TypeScript stripper for Nebula SFC `<script>` blocks.
 *
 * This is NOT a full TS parser. It focuses on:
 * - removing `: Type` annotations on variables, params, and properties
 * - removing `interface` and `type` declarations
 * - removing generic parameters on functions (`<T>`)
 *
 * The goal is to make the script valid JavaScript for further processing,
 * not to perfectly understand TypeScript semantics.
 */

/**
 * Strips a subset of TypeScript syntax from a script string.
 *
 * @param source - Raw script content (TS or JS).
 * @returns A JS‑compatible string with TS syntax removed.
 */
export function stripTypes(source: string): string {
  let code = source;

  // Remove interface declarations
  code = code.replace(/interface\s+\w+\s*{[^}]*}/gms, "");

  // Remove type aliases
  code = code.replace(/type\s+\w+\s*=\s*[^;]+;/gms, "");

  // Remove simple generic parameters on functions: function foo<T>(...
  code = code.replace(/function\s+(\w+)\s*<[^>]+>\s*\(/g, "function $1(");

  // Remove simple generic arrow functions: const foo = <T>(...
  code = code.replace(/=\s*<[^>]+>\s*\(/g, "= (");

  // Remove type annotations on variables and params: foo: Type
  code = code.replace(/:\s*[\w\[\]\<\>\|&\s,]+(?=[=;),{])/g, "")

  return code;
}
