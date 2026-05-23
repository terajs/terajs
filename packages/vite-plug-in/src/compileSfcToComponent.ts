import {
  compileComponentModuleParts,
  type ParsedSFC
} from "@terajs/sfc";

export function compileSfcToComponent(sfc: ParsedSFC): string {
  const compiled = compileComponentModuleParts(sfc);
  const importedBindingMap = compiled.importedBindings.length > 0
    ? `{
${compiled.importedBindings.map((binding) => `  ${JSON.stringify(binding)}: typeof ${binding} !== "undefined" ? ${binding} : undefined`).join(",\n")}
}`
    : "{}";
  const exposedBindings = JSON.stringify(compiled.exposedBindings);

  return `
import { component, applyHMRUpdate, renderIRModuleToFragment } from "@terajs/app";

${compiled.setupCode}

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

export let ir = ${JSON.stringify(compiled.ir, null, 2)};

export { __ssfc };

const Comp = component(
  {
    name: "${compiled.name}",
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
    applyHMRUpdate("${compiled.name}", nextSetup, nextIR);
  });
}

export default Comp;
`;
}
