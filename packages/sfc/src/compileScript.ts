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

import { stripTypes } from "./stripTypes.js";
import { tokenizeScript, type Token } from "./tokenizeScript.js";
import { scanTopLevel } from "./scanTopLevel.js";

export interface CompiledScript {
  /**
   * The generated setup function as JavaScript code.
   */
  setupCode: string;

  /**
   * Top‑level identifiers exposed to the template compiler.
   */
  exposed: string[];

  /**
   * Whether this script uses createResource and should be treated as async.
   */
  hasAsyncResource: boolean;
}

function hasCreateResourceCall(tokens: Token[]): boolean {
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (tokens[i].type === "identifier" && tokens[i].value === "createResource") {
      const next = tokens[i + 1];
      if (next && next.type === "punct" && next.value === "(") {
        return true;
      }
    }
  }
  return false;
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

  // 4. Detect async resource usage for streaming suspension.
  const hasAsyncResource = hasCreateResourceCall(tokens);

  // 5. Wrap in a renderer-local setup function
  const setupCode = `
function __ssfc(ctx) {
  const { props, slots, emit } = ctx;
  ${jsLike}
  return { ${identifiers.join(", ")} };
}
`.trim();

  return {
    setupCode,
    exposed: identifiers,
    hasAsyncResource
  };
}
