import { describe, expect, it } from "vitest";

import { compileComponentModuleParts, parseSFC } from "@terajs/sfc";
import { signal } from "@terajs/reactivity";

import { renderIRModuleToFragment } from "./renderFromIR.js";

const tick = () => Promise.resolve();

function executeCompiledSetup(setupCode: string): Record<string, unknown> {
  const createSetup = new Function(
    "signal",
    `${setupCode}\nreturn __ssfc;`
  ) as (signalFactory: typeof signal) => (ctx: { props: Record<string, unknown>; slots: Record<string, unknown>; emit: (...args: unknown[]) => void; }) => Record<string, unknown>;

  const setup = createSetup(signal);
  return setup({
    props: {},
    slots: {},
    emit: () => {}
  });
}

describe("compile core web integration", () => {
  it("renders and updates route-like DOM output from extracted compile-core parts", async () => {
    const sfc = parseSFC(
      `
<script>
const route = signal({
  title: "Launch route workspace",
  primaryAction: "Open diagnostics",
  footerNote: "Diagnostics ready"
})
</script>
<template>
  <section class="route-shell">
    <h1>{{ route.title }}</h1>
    <button type="button">{{ route.primaryAction }}</button>
    <footer>{{ route.footerNote }}</footer>
  </section>
</template>
`,
      "/src/routes/launch.tera"
    );

    const compiled = compileComponentModuleParts(sfc);
    const bindings = executeCompiledSetup(compiled.setupCode) as {
      route: ReturnType<typeof signal<{
        title: string;
        primaryAction: string;
        footerNote: string;
      }>>;
    };

    const root = document.createElement("div");
    root.appendChild(renderIRModuleToFragment(compiled.ir, bindings));

    const shell = root.firstElementChild as HTMLElement;
    const title = shell.querySelector("h1");
    const action = shell.querySelector("button");
    const footer = shell.querySelector("footer");

    expect(compiled.name).toBe("launch");
    expect(compiled.exposedBindings).toContain("route");
    expect(root.textContent).toContain("Launch route workspace");
    expect(root.textContent).toContain("Open diagnostics");
    expect(root.textContent).toContain("Diagnostics ready");

    bindings.route.set({
      title: "Diagnostics route workspace",
      primaryAction: "Open timing timeline",
      footerNote: "Mounted state snapshots ready"
    });
    await tick();

    expect(root.firstElementChild).toBe(shell);
    expect(shell.querySelector("h1")).toBe(title);
    expect(shell.querySelector("button")).toBe(action);
    expect(shell.querySelector("footer")).toBe(footer);
    expect(root.textContent).toContain("Diagnostics route workspace");
    expect(root.textContent).toContain("Open timing timeline");
    expect(root.textContent).toContain("Mounted state snapshots ready");
  });
});