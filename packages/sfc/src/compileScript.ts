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
import { transformScriptBlock } from "./compileScriptTransforms.js";
import { hoistTopLevelImports } from "./compileScriptImports.js";

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
   * Top-level imported bindings available to the compiled module.
   */
  importedBindings: string[];

  /**
   * Whether this script uses createResource and should be treated as async.
   */
  hasAsyncResource: boolean;
}

function extractImportedBindings(imports: string[]): string[] {
  const bindings = new Set<string>();

  for (const statement of imports) {
    const normalized = statement.replace(/\s+/g, " ").trim().replace(/;$/, "");

    if (/^import\s+["']/.test(normalized)) {
      continue;
    }

    const fromIndex = normalized.lastIndexOf(" from ");
    const clause = fromIndex === -1
      ? normalized.replace(/^import\s+/, "").trim()
      : normalized.slice("import ".length, fromIndex).trim();

    if (!clause) {
      continue;
    }

    const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespaceMatch) {
      bindings.add(namespaceMatch[1]);
    }

    const namedMatch = clause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      for (const entry of namedMatch[1].split(",")) {
        const trimmed = entry.trim();
        if (!trimmed) {
          continue;
        }

        const aliasMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
        if (aliasMatch) {
          bindings.add(aliasMatch[2]);
          continue;
        }

        bindings.add(trimmed);
      }
    }

    const defaultClause = clause
      .replace(/\{[^}]+\}/, "")
      .replace(/\*\s+as\s+[A-Za-z_$][\w$]*/, "")
      .replace(/,/g, " ")
      .trim();

    if (/^[A-Za-z_$][\w$]*$/.test(defaultClause)) {
      bindings.add(defaultClause);
    }
  }

  return [...bindings];
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

  // 1.5 Hoist top-level imports so setup() remains valid JavaScript.
  const { imports, body } = hoistTopLevelImports(jsLike);
  const namedBody = transformScriptBlock(body);
  const importedBindings = extractImportedBindings(imports);

  // 2. Tokenize
  const tokens = tokenizeScript(jsLike);

  // 3. Scan top‑level declarations
  const { identifiers } = scanTopLevel(tokens);

  // 4. Detect async resource usage for streaming suspension.
  const hasAsyncResource = hasCreateResourceCall(tokens);

  // 5. Wrap in a renderer-local setup function
  const setupCode = `
${imports.join("\n")}
function __ssfc(ctx) {
  const { props, slots, emit } = ctx;
  ${namedBody}
  return { ${identifiers.join(", ")} };
}
`.trim();

  return {
    setupCode,
    exposed: identifiers,
    importedBindings,
    hasAsyncResource
  };
}