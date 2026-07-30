import {
  compileScript,
  compileTemplateFromSFC,
  type ParsedSFC
} from "@terajs/sfc";
import { compileStyle, type IRModule, type IRNode } from "@terajs/compiler";
import { annotateRuntimeDebugNames } from "./annotateRuntimeDebugNames.js";

export interface CompileSfcToComponentOptions {
  autoImports?: Record<string, string>;
}

export function compileSfcToComponent(
  sfc: ParsedSFC,
  options: CompileSfcToComponentOptions = {}
): string {
  const scriptSource =
    typeof sfc.script === "string"
      ? sfc.script
      : sfc.script?.content ?? "";

  const script = compileScript(annotateRuntimeDebugNames(scriptSource));
  const ir = compileTemplateFromSFC(sfc);
  normalizeBuiltInComponentTags(ir);
  ir.hasAsyncResource = script.hasAsyncResource;
  const style = compileStyle(sfc, ir.scopeId);
  const styleId = style ? createStyleId(sfc.filePath) : null;
  const name = inferComponentName(sfc.filePath);
  const importedBindingMap = script.importedBindings.length > 0
    ? `{
${script.importedBindings.map((binding) => `  ${JSON.stringify(binding)}: typeof ${binding} !== "undefined" ? ${binding} : undefined`).join(",\n")}
}`
    : "{}";
  const exposedBindings = JSON.stringify(script.exposed);
  const autoImportEntries = Object.entries(options.autoImports ?? {});
  const autoImportMap = autoImportEntries.length > 0
    ? `{
${autoImportEntries.map(([name, localName]) => `  ${JSON.stringify(name)}: ${localName}`).join(",\n")}
}`
    : "{}";

  return `
import { ${[
  "component",
  "applyHMRUpdate",
  "renderIRModuleToFragment",
  "Link",
  "RouterView",
  ...(style ? ["registerStyle", "unregisterStyle"] : [])
].join(", ")} } from "@terajs/app";

${script.setupCode}
${style && styleId ? `
const __terajsStyleId = ${JSON.stringify(styleId)};
const __terajsCss = ${JSON.stringify(style.css)};

export function __terajsRegisterStyle() {
  unregisterStyle(__terajsStyleId);
  registerStyle(__terajsStyleId, __terajsCss);
}

__terajsRegisterStyle();
` : ""}

function normalizeComponentProps(input) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const next = Object.defineProperties({}, Object.getOwnPropertyDescriptors(input));
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
  const autoImports = ${autoImportMap};

  return {
    Link,
    RouterView,
    "router-view": RouterView,
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
${style && styleId ? `  import.meta.hot.dispose(() => {
    unregisterStyle(__terajsStyleId);
  });

` : ""}  import.meta.hot.accept((mod) => {
${style && styleId ? `    if (typeof mod.__terajsRegisterStyle === "function") {
      mod.__terajsRegisterStyle();
    }

` : ""}    const nextSetup = mod.__ssfc ?? null;
    const nextIR = ir;
    applyHMRUpdate("${name}", nextSetup, nextIR);
  });
}

export default Comp;
`;
}

function normalizeBuiltInComponentTags(ir: IRModule): void {
  for (const node of ir.template) {
    normalizeBuiltInComponentTag(node);
  }
}

function normalizeBuiltInComponentTag(node: IRNode): void {
  if (node.type === "element") {
    if (node.tag === "router-view") {
      node.tag = "RouterView";
    }

    for (const child of node.children) {
      normalizeBuiltInComponentTag(child);
    }
    return;
  }

  if (node.type === "portal") {
    for (const child of node.children) {
      normalizeBuiltInComponentTag(child);
    }
    return;
  }

  if (node.type === "slot") {
    for (const child of node.fallback) {
      normalizeBuiltInComponentTag(child);
    }
    return;
  }

  if (node.type === "slot-template") {
    for (const child of node.children) {
      normalizeBuiltInComponentTag(child);
    }
    return;
  }

  if (node.type === "if") {
    for (const child of node.then) {
      normalizeBuiltInComponentTag(child);
    }
    for (const child of node.else ?? []) {
      normalizeBuiltInComponentTag(child);
    }
    return;
  }

  if (node.type === "for") {
    for (const child of node.body) {
      normalizeBuiltInComponentTag(child);
    }
  }
}

function createStyleId(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  return `tera-style:${normalized}`;
}

function inferComponentName(filePath: string): string {
  const base = filePath.split("/").pop() || "Component";
  return base.replace(/\.\w+$/, "").replace(/[^A-Za-z0-9]/g, "") || "Component";
}
