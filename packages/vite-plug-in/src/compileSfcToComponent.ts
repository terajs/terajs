import {
  compileScript,
  compileTemplateFromSFC,
  type ParsedSFC
} from "@terajs/sfc";

export function compileSfcToComponent(sfc: ParsedSFC): string {
  const scriptSource =
    typeof sfc.script === "string"
      ? sfc.script
      : sfc.script?.content ?? "";

  const script = compileScript(scriptSource);
  const ir = compileTemplateFromSFC(sfc);
  ir.hasAsyncResource = script.hasAsyncResource;
  const name = inferComponentName(sfc.filePath);

  return `
import { component, applyHMRUpdate } from "@terajs/runtime";
import { renderIRModuleToFragment } from "@terajs/renderer-web";

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
    return () => renderIRModuleToFragment(ir, { ...ctx, props: componentProps, slots, emit });
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