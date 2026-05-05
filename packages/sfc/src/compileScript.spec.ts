import { describe, it, expect } from "vitest";
import { compileScript } from "./compileScript";

describe("compileScript (dependency‑free analyzer)", () => {
  it("extracts top-level const and function identifiers", () => {
    const raw = `
      const count = signal(0);
      function inc() { count.set(count() + 1); }
    `;

    const compiled = compileScript(raw);

    expect(compiled.exposed).toContain("count");
    expect(compiled.exposed).toContain("inc");
    expect(compiled.setupCode).toContain("function __ssfc");
    expect(compiled.setupCode).toContain("const { props, slots, emit } = ctx");
    expect(compiled.setupCode).toContain("return { count, inc }");
  });

  it("handles TypeScript annotations and strips them", () => {
    const raw = `
      const count: number = 0;
      function inc(step: number): void {
        console.log(step);
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.exposed).toContain("count");
    expect(compiled.exposed).toContain("inc");
    expect(compiled.setupCode).not.toContain(": number");
    expect(compiled.setupCode).not.toContain(": void");
  });

  it("handles classes at top level", () => {
    const raw = `
      class Store {
        value = 1;
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.exposed).toContain("Store");
    expect(compiled.setupCode).toContain("class Store");
  });

  it("ignores nested declarations (non-top-level)", () => {
    const raw = `
      function outer() {
        const inner = 1;
      }
    `;

    const compiled = compileScript(raw);

    // Only "outer" should be exposed
    expect(compiled.exposed).toEqual(["outer"]);
  });

  it("detects createResource usage in script code", () => {
    const raw = `
      import { createResource } from '@terajs/runtime';
      const user = createResource(async () => fetch('/api/user').then(r => r.json()));
    `;

    const compiled = compileScript(raw);

    expect(compiled.hasAsyncResource).toBe(true);
  });

  it("does not strip ternary array fallback expressions", () => {
    const raw = `
      function loadTasks(stored) {
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toContain("stored ? JSON.parse(stored) : []");
    expect(compiled.setupCode).toContain("Array.isArray(parsed) ? parsed : []");
  });

  it("does not strip numeric ternary fallback expressions", () => {
    const raw = `
      function latency(mode) {
        return mode === "lossy-50" ? 700 : 120;
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toContain("mode === \"lossy-50\" ? 700 : 120");
  });

  it("does not strip string ternary fallback expressions", () => {
    const raw = `
      function currentAttr(active) {
        return active ? "page" : null;
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toContain('return active ? "page" : null');
  });

  it("does not strip template literal ternary fallback expressions", () => {
    const raw = [
      "function dropdownItemClass(path) {",
      "  return isCurrent(path)",
      "    ? `${BASE} ${ACTIVE}`",
      "    : `${BASE} ${IDLE}`;",
      "}"
    ].join("\n");

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toContain('return isCurrent(path)');
    expect(compiled.setupCode).toContain('? `${BASE} ${ACTIVE}`');
    expect(compiled.setupCode).toContain(': `${BASE} ${IDLE}`');
  });

  it("still strips optional parameter annotations", () => {
    const raw = `
      function label(mode?: string) {
        return mode ? mode : "fallback";
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).not.toContain('mode?: string');
    expect(compiled.setupCode).toContain('return mode ? mode : "fallback"');
  });

  it("does not strip plain object literal property initializers", () => {
    const raw = `
      function createCard(data) {
        return { title: data.title, count: data.count };
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toContain("return { title: data.title, count: data.count }");
  });

  it("does not strip ternary object literal property initializers", () => {
    const raw = `
      function createLine(line) {
        return {
          text: typeof line === "string" ? line : "",
          kind: line ? "present" : "missing"
        };
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toContain('text: typeof line === "string" ? line : ""');
    expect(compiled.setupCode).toContain('kind: line ? "present" : "missing"');
  });

  it("hoists top-level import declarations above setup", () => {
    const raw = `
      import { signal } from "@terajs/reactivity";
      import "./styles.css";
      const count = signal(0);
    `;

    const compiled = compileScript(raw);
    const setupStart = compiled.setupCode.indexOf("function __ssfc");
    const signalImport = compiled.setupCode.indexOf("import { signal } from \"@terajs/reactivity\";");
    const styleImport = compiled.setupCode.indexOf("import \"./styles.css\";");
    const setupSegment = compiled.setupCode.slice(setupStart);

    expect(signalImport).toBeGreaterThanOrEqual(0);
    expect(styleImport).toBeGreaterThanOrEqual(0);
    expect(signalImport).toBeLessThan(setupStart);
    expect(styleImport).toBeLessThan(setupStart);
    expect(setupSegment).not.toContain("import { signal }");
    expect(setupSegment).not.toContain("import \"./styles.css\"");
    expect(compiled.importedBindings).toContain("signal");
  });

  it("tracks default, named, aliased, and namespace imports", () => {
    const raw = `
      import Button from "./Button.tera";
      import { HeroSection, PillarCard as Card } from "./cards";
      import * as Runtime from "@terajs/runtime";
      import "./styles.css";
    `;

    const compiled = compileScript(raw);

    expect(compiled.importedBindings).toEqual([
      "Button",
      "HeroSection",
      "Card",
      "Runtime"
    ]);
  });

  it("keeps dynamic import expressions inside setup code", () => {
    const raw = `
      async function loadHelpers() {
        return import("./helpers.js");
      }
    `;

    const compiled = compileScript(raw);
    const setupStart = compiled.setupCode.indexOf("function __ssfc");
    const setupSegment = compiled.setupCode.slice(setupStart);

    expect(setupSegment).toContain("return import(\"./helpers.js\")");
  });

  it("annotates reactive declarations with inferred variable names", () => {
    const raw = `
      const count = signal(0)
      const state = reactive({ ready: true })
      const mode = computed(() => count())
      const stopWatch = watch(() => count(), () => {})
      const stopWatchEffect = watchEffect(() => {
        count()
      })
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toContain('const count = signal(0, { key: "count" })');
    expect(compiled.setupCode).toContain('const state = reactive({ ready: true }, { group: "state" })');
    expect(compiled.setupCode).toContain('const mode = computed(() => count(), { key: "mode" })');
    expect(compiled.setupCode).toContain('const stopWatch = watch(() => count(), () => {}, { debugName: "stopWatch" })');
    expect(compiled.setupCode).toContain('const stopWatchEffect = watchEffect(() => {');
    expect(compiled.setupCode).toContain('{ debugName: "stopWatchEffect" }');
  });

  it("annotates composable-local declarations with composable names", () => {
    const raw = `
      function useCounter() {
        const count = ref(0)
        const state = reactive({ ready: true })
        return { count, state }
      }

      const usePanelState = () => {
        const mode = computed(() => 'ready')
        return { mode }
      }
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toContain('const count = ref(0, { key: "count", composable: "useCounter" })');
    expect(compiled.setupCode).toContain('const state = reactive({ ready: true }, { group: "state", composable: "useCounter" })');
    expect(compiled.setupCode).toMatch(/const mode = computed\(\(\) => ['"]ready['"], \{ key: "mode", composable: "usePanelState" \}\)/);
  });

  it("merges inferred names into existing option objects", () => {
    const raw = `
      const count = signal(0, { scope: 'Counter' })
      const state = reactive({ ready: true }, { scope: 'Counter' })
      const mode = computed(() => count(), { key: 'mode' })
    `;

    const compiled = compileScript(raw);

    expect(compiled.setupCode).toMatch(/signal\(0, \{ scope: ['"]Counter['"], key: "count" \}\)/);
    expect(compiled.setupCode).toMatch(/reactive\(\{ ready: true \}, \{ scope: ['"]Counter['"], group: "state" \}\)/);
    expect(compiled.setupCode).toMatch(/computed\(\(\) => count\(\), \{ key: ['"]mode['"] \}\)/);
  });
});
