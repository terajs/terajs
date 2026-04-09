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

import { stripTypes } from "./stripTypes";
import { tokenizeScript } from "./tokenizeScript";
import { scanTopLevel } from "./scanTopLevel";

export interface CompiledScript {
  /**
   * The generated setup function as JavaScript code.
   */
  setupCode: string;

  /**
   * Top‑level identifiers exposed to the template compiler.
   */
  exposed: string[];
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

  // 2. Tokenize
  const tokens = tokenizeScript(jsLike);

  // 3. Scan top‑level declarations
  const { identifiers } = scanTopLevel(tokens);

  // 4. Wrap in a renderer-local setup function
  const setupCode = `
function __ssfc(ctx) {
  const { props, slots, emit } = ctx;
  ${jsLike}
  return { ${identifiers.join(", ")} };
}
`.trim();

  return {
    setupCode,
    exposed: identifiers
  };
}
