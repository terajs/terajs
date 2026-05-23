import type { IRModule } from "@terajs/compiler";
import { annotateRuntimeDebugNames } from "./annotateRuntimeDebugNames.js";
import { compileScript } from "./compileScript.js";
import { compileTemplateFromSFC } from "./compileTemplate.js";
import type { ParsedSFC } from "./types.js";

export interface CompiledComponentModuleParts {
  name: string;
  setupCode: string;
  importedBindings: string[];
  exposedBindings: string[];
  ir: IRModule;
}

function inferComponentName(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const base = normalized.split("/").pop() || "Component";
  return base.replace(/\.\w+$/, "").replace(/[^A-Za-z0-9]/g, "") || "Component";
}

export function compileComponentModuleParts(sfc: ParsedSFC): CompiledComponentModuleParts {
  const scriptSource =
    typeof sfc.script === "string"
      ? sfc.script
      : sfc.script?.content ?? "";

  const script = compileScript(annotateRuntimeDebugNames(scriptSource));
  const ir = compileTemplateFromSFC(sfc);
  ir.hasAsyncResource = script.hasAsyncResource;

  return {
    name: inferComponentName(sfc.filePath),
    setupCode: script.setupCode,
    importedBindings: script.importedBindings,
    exposedBindings: script.exposed,
    ir
  };
}