/**
 * @file renderFromIR.spec.ts
 * @description
 * Tests for the reactive IR -> DOM renderer.
 */

import {
  renderIRNode,
  renderIRModuleToFragment
} from "./renderFromIR";

import type {
  IRModule,
  IRTextNode,
  IRInterpolationNode,
  IRElementNode,
  IRPortalNode,
  IRSlotNode,
  IRIfNode,
  IRForNode
} from "@terajs/compiler";

import { signal } from "@terajs/reactivity";

/** Ensures reactive effects flush before assertions */
const tick = () => Promise.resolve();

describe("IR -> DOM Renderer", () => {

  /* ---------------------------------------------------------------------- */
  /* TEXT                                                                   */
  /* ---------------------------------------------------------------------- */

  it("renders text nodes", () => {
    const node: IRTextNode = {
      type: "text",
      value: "Hello",
      loc: undefined,
      flags: {}
    };

    const dom = renderIRNode(node, {})!;
    expect(dom.nodeType).toBe(Node.TEXT_NODE);
    expect(dom.textContent).toBe("Hello");
  });

  /* ---------------------------------------------------------------------- */
  /* INTERPOLATION                                                          */
  /* ---------------------------------------------------------------------- */

  it("renders reactive interpolation", async () => {
    const count = signal(1);

    const node: IRInterpolationNode = {
      type: "interp",
      expression: "count",
      loc: undefined,
      flags: { dynamic: true }
    };

    const dom = renderIRNode(node, { count })!;
    expect(dom.textContent).toBe("1");

    count.set(2);
    await tick();
    expect(dom.textContent).toBe("2");
  });

  /* ---------------------------------------------------------------------- */
  /* ELEMENT + STATIC PROPS                                                 */
  /* ---------------------------------------------------------------------- */

  it("renders elements with static props", () => {
    const node: IRElementNode = {
      type: "element",
      tag: "div",
      props: [
        { kind: "static", name: "id", value: "foo" },
        { kind: "static", name: "class", value: "bar" }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, {}) as HTMLElement;

    expect(el.tagName.toLowerCase()).toBe("div");
    expect(el.id).toBe("foo");
    expect(el.className).toBe("bar");
  });

  /* ---------------------------------------------------------------------- */
  /* BIND PROPS                                                             */
  /* ---------------------------------------------------------------------- */

  it("binds reactive props", async () => {
    const color = signal("red");

    const node: IRElementNode = {
      type: "element",
      tag: "div",
      props: [
        { kind: "bind", name: "style", value: "color" }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, { color }) as HTMLElement;

    expect(el.style.color).toBe("red");

    color.set("blue");
    await tick();
    expect(el.style.color).toBe("blue");
  });

  /* ---------------------------------------------------------------------- */
  /* EVENTS                                                                 */
  /* ---------------------------------------------------------------------- */

  it("binds event handlers", () => {
    let clicked = false;

    const node: IRElementNode = {
      type: "element",
      tag: "button",
      props: [
        { kind: "event", name: "click", value: "onClick" }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, {
      onClick: () => { clicked = true; }
    }) as HTMLElement;

    el.click();
    expect(clicked).toBe(true);
  });

  /* ---------------------------------------------------------------------- */
  /* IF (reactive)                                                          */
  /* ---------------------------------------------------------------------- */

  it("renders reactive if nodes", async () => {
    const show = signal(true);

    const node: IRIfNode = {
      type: "if",
      condition: "show",
      then: [
        {
          type: "text",
          value: "YES",
          loc: undefined,
          flags: {}
        } as IRTextNode
      ],
      else: [
        {
          type: "text",
          value: "NO",
          loc: undefined,
          flags: {}
        } as IRTextNode
      ],
      loc: undefined,
      flags: {}
    };

    const dom = renderIRNode(node, { show })!;
    expect(dom.textContent).toBe("YES");

    show.set(false);
    await tick();
    expect(dom.textContent).toBe("NO");
  });

  it("disposes old branch effects when if node is removed", async () => {
    const show = signal(true);
    const count = signal(1);

    const node: IRIfNode = {
      type: "if",
      condition: "show",
      then: [
        {
          type: "interp",
          expression: "count",
          loc: undefined,
          flags: { dynamic: true }
        } as IRInterpolationNode
      ],
      else: [],
      loc: undefined,
      flags: {}
    };

    const root = document.createElement("div");
    const dom = renderIRNode(node, { show, count })!;
    root.appendChild(dom);

    const removedText = root.lastChild as Text;
    expect(root.textContent).toBe("1");

    show.set(false);
    await tick();
    expect(root.textContent).toBe("");

    count.set(2);
    await tick();

    expect(removedText.textContent).toBe("1");
  });

  /* ---------------------------------------------------------------------- */
  /* FOR (reactive)                                                         */
  /* ---------------------------------------------------------------------- */

  it("renders reactive for nodes", async () => {
    const items = signal<number[]>([1, 2]);

    const node: IRForNode = {
      type: "for",
      each: "items",
      item: "item",
      index: "i",
      body: [
        {
          type: "element",
          tag: "div",
          props: [],
          children: [
            {
              type: "interp",
              expression: "item",
              loc: undefined,
              flags: { dynamic: true }
            } as IRInterpolationNode
          ],
          loc: undefined,
          flags: { hasDirectives: false }
        } as IRElementNode
      ],
      loc: undefined,
      flags: { hasDirectives: true }
    };

    const dom = renderIRNode(node, { items })!;
    expect(dom.textContent).toBe("12");

    items.set([3, 4, 5]);
    await tick();
    expect(dom.textContent).toBe("345");
  });

  it("renders slot content before fallback", () => {
    const node: IRSlotNode = {
      type: "slot",
      name: "default",
      fallback: [
        {
          type: "text",
          value: "Fallback",
          loc: undefined,
          flags: {}
        } as IRTextNode
      ],
      loc: undefined,
      flags: { dynamic: true }
    };

    const dom = renderIRNode(node, {
      slots: {
        default: () => document.createTextNode("Projected")
      }
    })!;

    expect(dom.textContent).toBe("Projected");
  });

  it("renders slot fallback when no slot is provided", () => {
    const node: IRSlotNode = {
      type: "slot",
      name: "header",
      fallback: [
        {
          type: "text",
          value: "Fallback",
          loc: undefined,
          flags: {}
        } as IRTextNode
      ],
      loc: undefined,
      flags: { dynamic: true }
    };

    const dom = renderIRNode(node, {})!;
    expect(dom.textContent).toBe("Fallback");
  });

  it("renders portal children into the requested target", () => {
    const overlay = document.createElement("div");
    overlay.id = "overlay";
    document.body.appendChild(overlay);

    const node: IRPortalNode = {
      type: "portal",
      target: {
        kind: "static",
        name: "to",
        value: "#overlay"
      },
      children: [
        {
          type: "element",
          tag: "div",
          props: [],
          children: [
            {
              type: "text",
              value: "Portal body",
              loc: undefined,
              flags: {}
            } as IRTextNode
          ],
          loc: undefined,
          flags: {}
        } as IRElementNode
      ],
      loc: undefined,
      flags: { dynamic: false }
    };

    const dom = renderIRNode(node, {})!;

    expect(dom.textContent).toBe("");
    expect(overlay.textContent).toBe("Portal body");

    overlay.remove();
  });

  /* ---------------------------------------------------------------------- */
  /* MODULE RENDERING                                                       */
  /* ---------------------------------------------------------------------- */

  it("renders an IRModule into a fragment", () => {
    const ir: IRModule = {
      filePath: "/test",
      template: [
        {
          type: "text",
          value: "A",
          loc: undefined,
          flags: {}
        } as IRTextNode,
        {
          type: "text",
          value: "B",
          loc: undefined,
          flags: {}
        } as IRTextNode
      ],
      meta: {},
      route: null
    };

    const frag = renderIRModuleToFragment(ir, {});
    expect(frag.textContent).toBe("AB");
  });

  it("creates SVG namespaced elements for SVG tags", () => {
    const node: IRElementNode = {
      type: "element",
      tag: "svg",
      props: [],
      children: [
        {
          type: "element",
          tag: "path",
          props: [{ kind: "static", name: "d", value: "M0 0" }],
          children: [],
          loc: undefined,
          flags: { hasDirectives: false }
        } as IRElementNode
      ],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, {}) as Element;
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect((el.firstChild as Element | null)?.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });
});

