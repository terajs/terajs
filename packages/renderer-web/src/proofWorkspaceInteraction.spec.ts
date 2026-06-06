import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compileComponentModuleParts, parseSFC } from "@terajs/sfc";
import { signal } from "@terajs/reactivity";
import { clearDebugHistory, normalizeSharedDebugEvent, readDebugHistory } from "@terajs/shared";

import { renderIRModuleToFragment } from "./renderFromIR.js";

const tick = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolveTick) => setTimeout(resolveTick, 0));
};

function executeCompiledSetup(setupCode: string): Record<string, unknown> {
  const createSetup = new Function(
    "signal",
    `${setupCode}\nreturn __ssfc;`
  ) as (signalFactory: typeof signal) => (ctx: {
    props: Record<string, unknown>;
    slots: Record<string, unknown>;
    emit: (...args: unknown[]) => void;
  }) => Record<string, unknown>;

  const setup = createSetup(signal);
  return setup({
    props: {},
    slots: {},
    emit: () => {}
  });
}

function click(element: Element | null): void {
  element?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
}

function inputText(element: Element | null, value: string): void {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("Expected a proof workspace text input.");
  }

  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
}

afterEach(() => {
  clearDebugHistory();
});

describe("proof workspace interaction", () => {
  it("updates local state, toggles conditional content, and reorders keyed items", async () => {
    const filePath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "shared",
      "test",
      "fixtures",
      "proof-workspace",
      "src",
      "shared",
      "components",
      "ProofStateBoard.tera"
    );
    const source = await readFile(filePath, "utf8");
    const sfc = parseSFC(source, "/src/shared/components/ProofStateBoard.tera");
    const compiled = compileComponentModuleParts(sfc);
    const bindings = executeCompiledSetup(compiled.setupCode);
    clearDebugHistory();

    const root = document.createElement("div");
    root.appendChild(renderIRModuleToFragment(compiled.ir, bindings));

    const storyIds = () => Array.from(root.querySelectorAll("[data-story-id]"))
      .map((node) => (node as HTMLElement).dataset.storyId);

    expect(storyIds()).toEqual(["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"]);
    expect(root.querySelector("[data-selected-host]")?.textContent).toBe("web");
    expect(root.querySelector("[data-note-filter-summary]")?.textContent).toContain("inactive");

    inputText(root.querySelector('input[data-action="host-note-filter"]'), "Android");
    await tick();

    expect((root.querySelector('input[data-action="host-note-filter"]') as HTMLInputElement | null)?.value).toBe("Android");
    expect(root.querySelector("[data-note-filter-summary]")?.textContent).toContain("Android");

    click(root.querySelector('button[data-story-target="bravo"]'));
    await tick();

    expect(root.querySelector("[data-selected-host]")?.textContent).toBe("android");
    expect(root.querySelector("[data-note-filter-summary]")?.textContent).toContain("Android");

    click(root.querySelector('button[data-action="promote-selected"]'));
    await tick();

    expect(storyIds()).toEqual(["bravo", "alpha", "charlie", "delta", "echo", "foxtrot"]);
    expect(root.querySelector("[data-selected-host]")?.textContent).toBe("android");

    click(root.querySelector('button[data-action="toggle-queue"]'));
    await tick();

    expect(root.querySelector("[data-queue-list]")).toBeNull();

    click(root.querySelector('button[data-action="toggle-queue"]'));
    await tick();

    expect(storyIds()).toEqual(["bravo", "alpha", "charlie", "delta", "echo", "foxtrot"]);

    const stateEvents = readDebugHistory().flatMap((event) => {
      const normalized = normalizeSharedDebugEvent(event);
      return normalized?.type === "reactive:updated" ? [normalized] : [];
    });

    expect(stateEvents.some((event) => event.payload.next === "bravo")).toBe(true);
    expect(stateEvents.some((event) => event.payload.next === "Android")).toBe(true);
    expect(stateEvents.some((event) => event.payload.next === false)).toBe(true);
    expect(stateEvents.some((event) => Array.isArray(event.payload.next))).toBe(true);
  });
});
