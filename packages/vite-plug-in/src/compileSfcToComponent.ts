import {
  compileScript,
  compileTemplateFromSFC,
  type ParsedSFC
} from "@terajs/sfc";
import { annotateRuntimeDebugNames } from "./annotateRuntimeDebugNames.js";

export function compileSfcToComponent(sfc: ParsedSFC): string {
  const scriptSource =
    typeof sfc.script === "string"
      ? sfc.script
      : sfc.script?.content ?? "";

  const script = compileScript(annotateRuntimeDebugNames(scriptSource));
  const ir = compileTemplateFromSFC(sfc);
  ir.hasAsyncResource = script.hasAsyncResource;
  const name = inferComponentName(sfc.filePath);
  const importedBindingMap = script.importedBindings.length > 0
    ? `{
${script.importedBindings.map((binding) => `  ${JSON.stringify(binding)}: typeof ${binding} !== "undefined" ? ${binding} : undefined`).join(",\n")}
}`
    : "{}";
  const exposedBindings = JSON.stringify(script.exposed);

  return `
import { component, applyHMRUpdate, renderIRModuleToFragment } from "terajs";

${script.setupCode}

function normalizeComponentProps(input) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const next = { ...input };
  delete next.children;
  delete next.slots;
  return next;
}

function normalizeSlots(input) {
  const slots = {};

  if (input && typeof input === "object" && input.slots && typeof input.slots === "object") {
    for (const key of Object.keys(input.slots)) {
      const value = input.slots[key];
      slots[key] = typeof value === "function" ? value : () => value;
    }
  }

  if (input && Object.prototype.hasOwnProperty.call(input, "children") && input.children != null) {
    const value = input.children;
    slots.default = typeof value === "function" ? value : () => value;
  }

  return slots;
}

function pickBindings(names, source) {
  const next = {};

  if (!source || typeof source !== "object") {
    return next;
  }

  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(source, name)) {
      next[name] = source[name];
    }
  }

  return next;
}

function createComponentRegistry(ctx) {
  const autoImports = typeof TerajsAutoImports === "object" && TerajsAutoImports
    ? TerajsAutoImports
    : {};

  return {
    ...autoImports,
    ...${importedBindingMap},
    ...pickBindings(${exposedBindings}, ctx)
  };
}

export let ir = ${JSON.stringify(ir, null, 2)};

export { __ssfc };

const Comp = component(
  {
    name: "${name}",
    meta: ir.meta,
    ai: ir.ai,
    route: ir.route
  },
  (props) => {
    const componentProps = normalizeComponentProps(props);
    const slots = normalizeSlots(props);
    const emit = () => {};
    const ctx = __ssfc({ props: componentProps, slots, emit });
    return () => renderIRModuleToFragment(ir, {
      ...ctx,
      props: componentProps,
      slots,
      emit,
      __components: createComponentRegistry(ctx)
    });
  }
);

if (import.meta.hot) {
  import.meta.hot.accept((mod) => {
    const nextSetup = mod.__ssfc ?? null;
    const nextIR = ir;
    applyHMRUpdate("${name}", nextSetup, nextIR);
  });
}

export default Comp;
`;
}

function inferComponentName(filePath: string): string {
  const base = filePath.split("/").pop() || "Component";
  return base.replace(/\.\w+$/, "").replace(/[^A-Za-z0-9]/g, "") || "Component";
}