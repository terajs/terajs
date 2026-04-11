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
});
