/**
 * @file irJsxParity.spec.tsx
 * @description
 * Ensures JSX rendering and IR rendering behave identically over time.
 */

import { template } from "./template";
import { renderIRNode } from "./renderFromIR";

import type {
  IRElementNode,
  IRInterpolationNode,
  IRIfNode,
  IRTextNode,
  IRForNode,
} from "@terajs/compiler";

import { signal } from "@terajs/reactivity";

const tick = () => Promise.resolve();

function text(node: Node): string {
  return node.textContent || "";
}

function mountInHost(node: Node): HTMLDivElement {
  const host = document.createElement("div");
  host.appendChild(node);
  return host;
}

describe("JSX <-> IR Parity", () => {
  /* ---------------------------------------------------------------------- */
  /* INTERPOLATION                                                          */
  /* ---------------------------------------------------------------------- */

  it("keeps JSX and IR in sync for reactive interpolation", async () => {
    const count = signal(1);

    // JSX
    const jsxDom = template(() => <div>{count()}</div>);

    // IR
    const ir: IRElementNode = {
      type: "element",
      tag: "div",
      props: [],
      children: [
        {
          type: "interp",
          expression: "count",
          loc: undefined,
          flags: { dynamic: true },
        } as IRInterpolationNode,
      ],
      loc: undefined,
      flags: { hasDirectives: false },
    };

    const irDom = renderIRNode(ir, { count })!;
    const jsxHost = mountInHost(jsxDom);
    const irHost = mountInHost(irDom);

    expect(text(jsxHost)).toBe("1");
    expect(text(irHost)).toBe("1");

    count.set(2);
    await tick();

    expect(text(jsxHost)).toBe("2");
    expect(text(irHost)).toBe("2");
  });

  /* ---------------------------------------------------------------------- */
  /* IF                                                                     */
  /* ---------------------------------------------------------------------- */

  it("keeps JSX and IR in sync for reactive if", async () => {
    const show = signal(true);

    // JSX
    const jsxDom = template(() =>
      show() ? <span>YES</span> : <span>NO</span>
    );

    // IR
    const ir: IRIfNode = {
      type: "if",
      condition: "show",
      then: [
        {
          type: "element",
          tag: "span",
          props: [],
          children: [
            {
              type: "text",
              value: "YES",
              loc: undefined,
              flags: {},
            } as IRTextNode,
          ],
          loc: undefined,
          flags: { hasDirectives: false },
        } as IRElementNode,
      ],
      else: [
        {
          type: "element",
          tag: "span",
          props: [],
          children: [
            {
              type: "text",
              value: "NO",
              loc: undefined,
              flags: {},
            } as IRTextNode,
          ],
          loc: undefined,
          flags: { hasDirectives: false },
        } as IRElementNode,
      ],
      loc: undefined,
      flags: {},
    };

    const irDom = renderIRNode(ir, { show })!;
    const jsxHost = mountInHost(jsxDom);
    const irHost = mountInHost(irDom);

    expect(text(jsxHost)).toBe("YES");
    expect(text(irHost)).toBe("YES");

    show.set(false);
    await tick();

    expect(text(jsxHost)).toBe("NO");
    expect(text(irHost)).toBe("NO");
  });

  /* ---------------------------------------------------------------------- */
  /* FOR                                                                    */
  /* ---------------------------------------------------------------------- */

  it("keeps JSX and IR in sync for reactive for", async () => {
    const items = signal([1, 2]);

    // JSX
    const jsxDom = template(() => (
      <div>
        {items().map((item) => (
          <span>{item}</span>
        ))}
      </div>
    ));

    // IR
    const ir: IRForNode = {
      type: "for",
      each: "items",
      item: "item",
      index: "i",
      body: [
        {
          type: "element",
          tag: "span",
          props: [],
          children: [
            {
              type: "interp",
              expression: "item",
              loc: undefined,
              flags: { dynamic: true },
            } as IRInterpolationNode,
          ],
          loc: undefined,
          flags: { hasDirectives: false },
        } as IRElementNode,
      ],
      loc: undefined,
      flags: { hasDirectives: true },
    };

    const irDom = renderIRNode(ir, { items })!;
    const jsxHost = mountInHost(jsxDom);
    const irHost = mountInHost(irDom);

    expect(text(jsxHost)).toBe("12");
    expect(text(irHost)).toBe("12");

    items.set([3, 4, 5]);
    await tick();

    expect(text(jsxHost)).toBe("345");
    expect(text(irHost)).toBe("345");
  });
});

