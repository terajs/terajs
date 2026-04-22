import { afterEach, describe, expect, it, vi } from "vitest";
import type { IRElementNode, IRInterpolationNode } from "@terajs/compiler";

const originalNodeEnv = process.env.NODE_ENV;
const tick = () => Promise.resolve();

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("production renderer instrumentation gating", () => {
  it("skips renderer debug events during IR render and reactive DOM updates", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const shared = await import("@terajs/shared");
    const { signal } = await import("@terajs/reactivity");
    const { renderIRNode } = await import("./renderFromIR.js");
    const debugSpy = vi.spyOn(shared.Debug, "emit");

    shared.resetDebugHandlers();
    shared.resetDebugListeners();
    shared.clearDebugHistory();

    const label = signal("alpha");
    const color = signal("red");
    const child: IRInterpolationNode = {
      type: "interp",
      expression: "label",
      loc: undefined,
      flags: { dynamic: true }
    };
    const node: IRElementNode = {
      type: "element",
      tag: "div",
      props: [
        { kind: "bind", name: "style", value: "styles" }
      ],
      children: [child],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, {
      label,
      styles: () => ({ color: color() })
    }) as HTMLElement;

    expect(el.textContent).toBe("alpha");
    expect(el.style.color).toBe("red");

    label.set("beta");
    color.set("blue");
    await tick();

    expect(el.textContent).toBe("beta");
    expect(el.style.color).toBe("blue");
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("renders and updates flat text-shell IR elements in production", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const shared = await import("@terajs/shared");
    const { signal } = await import("@terajs/reactivity");
    const { renderIRNode } = await import("./renderFromIR.js");
    const debugSpy = vi.spyOn(shared.Debug, "emit");

    const label = signal("alpha");
    const node: IRElementNode = {
      type: "element",
      tag: "span",
      props: [
        { kind: "static", name: "data-shell", value: "yes" }
      ],
      children: [
        {
          type: "interp",
          expression: "label",
          loc: undefined,
          flags: { dynamic: true }
        }
      ],
      loc: undefined,
      flags: { static: false, hasDirectives: false }
    };

    const el = renderIRNode(node, { label }) as HTMLElement;

    expect(el.getAttribute("data-shell")).toBe("yes");
    expect(el.textContent).toBe("alpha");

    label.set("beta");
    await tick();

    expect(el.textContent).toBe("beta");
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("skips list reconciliation debug events in production", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const shared = await import("@terajs/shared");
    const { updateKeyedList } = await import("./updateKeyedList.js");
    const debugSpy = vi.spyOn(shared.Debug, "emit");

    const parent = document.createElement("div");
    const makeItem = (key: string, text: string) => {
      const node = document.createElement("div");
      node.textContent = text;
      return { key, node };
    };

    const a = makeItem("a", "a");
    const b = makeItem("b", "b");
    const c = makeItem("c", "c");
    const d = makeItem("d", "d");
    const oldItems = [a, b, c];
    const newItems = [d, b, a, c];

    oldItems.forEach((item) => parent.appendChild(item.node));

    updateKeyedList(
      parent,
      oldItems,
      newItems,
      (item, target, anchor) => {
        target.insertBefore(item.node, anchor);
      },
      (item, target) => {
        target.removeChild(item.node);
      },
    );

    await tick();

    expect(parent.textContent).toBe("dbac");
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("skips component render debug events when mounting into a root", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const shared = await import("@terajs/shared");
    const { renderIntoRoot } = await import("./render.js");
    const debugSpy = vi.spyOn(shared.Debug, "emit");
    const root = document.createElement("div");

    renderIntoRoot(() => {
      const el = document.createElement("section");
      el.textContent = "ready";
      return el;
    }, root);

    await tick();

    expect(root.textContent).toBe("ready");
    expect(debugSpy).not.toHaveBeenCalled();
  });
});