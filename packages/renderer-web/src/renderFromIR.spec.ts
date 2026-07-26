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

import { computed, dispose, effect, ref, signal } from "@terajs/reactivity";
import { component, onMounted, onUnmounted } from "@terajs/runtime";
import { clear } from "./dom";

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

  it("renders reactive ref interpolation", async () => {
    const count = ref(1);

    const node: IRInterpolationNode = {
      type: "interp",
      expression: "count",
      loc: undefined,
      flags: { dynamic: true }
    };

    const dom = renderIRNode(node, { count })!;
    expect(dom.textContent).toBe("1");

    count.value = 2;
    await tick();
    expect(dom.textContent).toBe("2");
  });

  it("renders hinted simple-path interpolation", async () => {
    const user = signal({ name: "Alpha" });

    const node: IRInterpolationNode = {
      type: "interp",
      expression: "user.name",
      binding: {
        kind: "simple-path",
        segments: ["user", "name"]
      },
      loc: undefined,
      flags: { dynamic: true }
    };

    const dom = renderIRNode(node, { user })!;
    expect(dom.textContent).toBe("Alpha");

    user.set({ name: "Beta" });
    await tick();
    expect(dom.textContent).toBe("Beta");
  });

  it("renders call-expression interpolation", () => {
    const node: IRInterpolationNode = {
      type: "interp",
      expression: "label()",
      loc: undefined,
      flags: { dynamic: true }
    };

    const dom = renderIRNode(node, {
      label: () => "Computed label"
    })!;

    expect(dom.textContent).toBe("Computed label");
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

  it("binds hinted direct props", async () => {
    const title = signal("Alpha");

    const node: IRElementNode = {
      type: "element",
      tag: "div",
      props: [
        {
          kind: "bind",
          name: "title",
          value: "title",
          binding: {
            kind: "simple-path",
            segments: ["title"]
          }
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, { title }) as HTMLElement;

    expect(el.title).toBe("Alpha");

    title.set("Beta");
    await tick();
    expect(el.title).toBe("Beta");
  });

  it("binds hinted simple-path props", async () => {
    const user = signal({ name: "Alpha" });

    const node: IRElementNode = {
      type: "element",
      tag: "div",
      props: [
        {
          kind: "bind",
          name: "title",
          value: "user.name",
          binding: {
            kind: "simple-path",
            segments: ["user", "name"]
          }
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, { user }) as HTMLElement;

    expect(el.title).toBe("Alpha");

    user.set({ name: "Beta" });
    await tick();
    expect(el.title).toBe("Beta");
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

  it("binds event call expressions with $event", () => {
    let value = "";

    const node: IRElementNode = {
      type: "element",
      tag: "input",
      props: [
        { kind: "event", name: "input", value: "updateValue($event)" }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, {
      updateValue: (event: Event) => {
        value = (event.target as HTMLInputElement | null)?.value ?? "";
      }
    }) as HTMLInputElement;

    el.value = "offline flight";
    el.dispatchEvent(new Event("input", { bubbles: true }));

    expect(value).toBe("offline flight");
  });

  it("applies prevent event modifiers while preserving $event", () => {
    let receivedEvent: Event | null = null;

    const node: IRElementNode = {
      type: "element",
      tag: "button",
      props: [
        { kind: "event", name: "click", value: "handler($event)", modifiers: ["prevent"] }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, {
      handler: (event: Event) => {
        receivedEvent = event;
      }
    }) as HTMLButtonElement;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });

    const result = el.dispatchEvent(event);

    expect(receivedEvent).toBe(event);
    expect(event.defaultPrevented).toBe(true);
    expect(result).toBe(false);
  });

  it("applies submit prevent modifiers while preserving $event", () => {
    let submitted = false;
    let receivedEvent: Event | null = null;

    const node: IRElementNode = {
      type: "element",
      tag: "form",
      props: [
        { kind: "event", name: "submit", value: "submit($event)", modifiers: ["prevent"] }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const el = renderIRNode(node, {
      submit: (event: Event) => {
        submitted = true;
        receivedEvent = event;
      }
    }) as HTMLFormElement;
    const event = new Event("submit", { bubbles: true, cancelable: true });

    const result = el.dispatchEvent(event);

    expect(submitted).toBe(true);
    expect(receivedEvent).toBe(event);
    expect(event.defaultPrevented).toBe(true);
    expect(result).toBe(false);
  });

  it("applies stop event modifiers while preserving $event", () => {
    let childEvent: Event | null = null;
    let parentClicks = 0;

    const node: IRElementNode = {
      type: "element",
      tag: "button",
      props: [
        { kind: "event", name: "click", value: "handler($event)", modifiers: ["stop"] }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const parent = document.createElement("div");
    parent.addEventListener("click", () => {
      parentClicks += 1;
    });

    const el = renderIRNode(node, {
      handler: (event: Event) => {
        childEvent = event;
      }
    }) as HTMLButtonElement;
    parent.appendChild(el);

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    el.dispatchEvent(event);

    expect(childEvent).toBe(event);
    expect(parentClicks).toBe(0);
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

  it("does not rebuild an if branch when component setup state changes", async () => {
    const show = signal(true);
    const count = signal(1);

    const Child = () => {
      const el = document.createElement("span");
      el.textContent = String(count());
      return el;
    };

    const node: IRIfNode = {
      type: "if",
      condition: "show",
      then: [
        {
          type: "element",
          tag: "Child",
          props: [],
          children: [],
          loc: undefined,
          flags: { hasDirectives: false }
        } as IRElementNode
      ],
      else: [],
      loc: undefined,
      flags: {}
    };

    const root = document.createElement("div");
    const dom = renderIRNode(node, {
      show,
      __components: { Child }
    })!;
    root.appendChild(dom);

    const originalChild = root.querySelector("span");
    expect(originalChild?.textContent).toBe("1");

    count.set(2);
    await tick();

    expect(root.querySelector("span")).toBe(originalChild);
    expect(root.textContent).toBe("1");
  });

  it("does not rebuild an if branch when its dependency invalidates to the same boolean", async () => {
    const state = signal({ visible: true, revision: 1 });
    const visible = computed(() => state().visible);
    let mounted = 0;
    let unmounted = 0;

    const Child = component({ name: "StableConditionalChild" }, () => {
      onMounted(() => {
        mounted += 1;
      });
      onUnmounted(() => {
        unmounted += 1;
      });

      const element = document.createElement("span");
      element.textContent = "Stable";
      return element;
    });
    const node: IRIfNode = {
      type: "if",
      condition: "visible.get()",
      then: [{
        type: "element",
        tag: "Child",
        props: [],
        children: [],
        loc: undefined,
        flags: { hasDirectives: false }
      } as IRElementNode],
      else: [],
      loc: undefined,
      flags: {}
    };
    const root = document.createElement("div");
    root.appendChild(renderIRNode(node, {
      visible,
      __components: { Child }
    })!);
    await tick();

    const originalChild = root.querySelector("span");
    state.set({ visible: true, revision: 2 });
    await tick();

    expect(root.querySelector("span")).toBe(originalChild);
    expect(mounted).toBe(1);
    expect(unmounted).toBe(0);

    state.set({ visible: false, revision: 3 });
    await tick();

    expect(root.querySelector("span")).toBeNull();
    expect(unmounted).toBe(1);
  });

  it("keeps effects created inside an if branch independent from the branch condition", async () => {
    const show = signal(true);
    const count = signal(1);
    let childRuns = 0;

    const node: IRIfNode = {
      type: "if",
      condition: "show",
      then: [{
        type: "interp",
        expression: "count",
        loc: undefined,
        flags: { dynamic: true }
      } as IRInterpolationNode],
      else: [],
      loc: undefined,
      flags: {}
    };

    const trackedCount = () => {
      childRuns += 1;
      return count();
    };
    const root = document.createElement("div");
    root.appendChild(renderIRNode(node, { show, trackedCount, count: trackedCount })!);
    const originalChild = root.lastChild;

    count.set(2);
    await tick();

    expect(root.lastChild).toBe(originalChild);
    expect(root.textContent).toBe("2");
    expect(childRuns).toBe(2);
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

  it("reuses keyed row DOM for single-root IR for bodies", async () => {
    const items = signal([
      { id: "a", label: "A" },
      { id: "b", label: "B" }
    ]);

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
              expression: "item.label",
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

    const root = document.createElement("div");
    root.appendChild(renderIRNode(node, { items })!);

    const firstNode = root.children[0];
    const secondNode = root.children[1];
    expect(root.textContent).toBe("AB");

    items.set([
      { id: "b", label: "B2" },
      { id: "a", label: "A" }
    ]);
    await tick();

    expect(root.textContent).toBe("B2A");
    expect(root.children[0]).toBe(secondNode);
    expect(root.children[1]).toBe(firstNode);
  });

  it("renders structural for nodes with plain loop locals and preserved wrappers", async () => {
    const items = signal([
      { id: "a", label: "A" },
      { id: "b", label: "B" }
    ]);

    const node: IRForNode = {
      type: "for",
      each: "items",
      item: "item",
      index: "i",
      isStructural: true,
      body: [
        {
          type: "element",
          tag: "li",
          props: [],
          children: [
            {
              type: "interp",
              expression: "typeof item === 'function' && typeof item.set === 'function' ? 'signal' : item.label",
              loc: undefined,
              flags: { dynamic: true }
            } as IRInterpolationNode,
            {
              type: "text",
              value: ":",
              loc: undefined,
              flags: {}
            } as IRTextNode,
            {
              type: "interp",
              expression: "typeof i === 'function' && typeof i.set === 'function' ? 'signal' : i",
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

    const root = document.createElement("ul");
    root.appendChild(renderIRNode(node, { items })!);

    expect(Array.from(root.children).map((child) => child.tagName)).toEqual(["LI", "LI"]);
    expect(root.textContent).toBe("A:0B:1");

    items.set([
      { id: "b", label: "B2" },
      { id: "c", label: "C" }
    ]);
    await tick();

    expect(Array.from(root.children).map((child) => child.tagName)).toEqual(["LI", "LI"]);
    expect(root.textContent).toBe("B2:0C:1");
    expect(root.textContent).not.toContain("signal");
  });

  it("reuses keyed structural rows with live plain loop locals and event expressions", async () => {
    const items = signal([
      { id: "a", label: "A" },
      { id: "b", label: "B" }
    ]);
    const selected: string[] = [];
    const node: IRForNode = {
      type: "for",
      each: "items",
      item: "item",
      index: "i",
      isStructural: true,
      body: [{
        type: "element",
        tag: "button",
        props: [
          {
            kind: "bind",
            name: "key",
            value: "item.id",
            binding: { kind: "simple-path", segments: ["item", "id"] }
          },
          {
            kind: "event",
            name: "click",
            value: "select(item.id, i)"
          }
        ],
        children: [{
          type: "interp",
          expression: "item.label",
          loc: undefined,
          flags: { dynamic: true }
        } as IRInterpolationNode],
        loc: undefined,
        flags: { hasDirectives: false }
      } as IRElementNode],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const root = document.createElement("div");
    root.appendChild(renderIRNode(node, {
      items,
      select: (id: string, index: number) => selected.push(`${id}:${index}`)
    })!);

    const firstNode = root.children[0];
    const secondNode = root.children[1];
    items.set([
      { id: "b", label: "B2" },
      { id: "a", label: "A2" }
    ]);
    await tick();

    expect(root.textContent).toBe("B2A2");
    expect(root.children[0]).toBe(secondNode);
    expect(root.children[1]).toBe(firstNode);

    (root.children[0] as HTMLButtonElement).click();
    (root.children[1] as HTMLButtonElement).click();
    expect(selected).toEqual(["b:0", "a:1"]);
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

  it("renders nested component tags from the component registry", () => {
    const Card = () => {
      const el = document.createElement("article");
      el.textContent = "Nested card";
      return el;
    };

    const node: IRElementNode = {
      type: "element",
      tag: "Card",
      props: [],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const dom = renderIRNode(node, {
      __components: { Card }
    }) as HTMLElement;

    expect(dom.tagName.toLowerCase()).toBe("article");
    expect(dom.textContent).toBe("Nested card");
  });

  it("updates a structural for nested in an active if branch", async () => {
    const mobile = signal(true);
    const items = signal<Array<{ id: string; label: string }>>([]);
    const node: IRIfNode = {
      type: "if",
      condition: "mobile",
      then: [
        {
          type: "for",
          each: "items()",
          item: "item",
          index: "i",
          isStructural: true,
          body: [
            {
              type: "element",
              tag: "section",
              props: [],
              children: [
                {
                  type: "interp",
                  expression: "item.label",
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
        } as IRForNode
      ],
      else: [],
      loc: undefined,
      flags: {}
    };

    const root = document.createElement("div");
    root.appendChild(renderIRNode(node, { mobile, items: () => items() })!);
    expect(root.querySelectorAll("section")).toHaveLength(0);
    expect(root.innerHTML).toContain("<!--for-->");

    items.set([{ id: "review", label: "Review Assumptions" }]);
    await tick();

    expect(root.querySelectorAll("section")).toHaveLength(1);
    expect(root.textContent).toBe("Review Assumptions");
  });

  it("updates dynamic component props without rebuilding the component", async () => {
    const label = signal("First");
    let setupRuns = 0;

    const Child = component({ name: "ReactivePropChild" }, (props: any) => {
      setupRuns += 1;
      return () => {
        const el = document.createElement("span");
        el.textContent = String(props.label);
        return el;
      };
    });

    const node: IRElementNode = {
      type: "element",
      tag: "Child",
      props: [{
        kind: "bind",
        name: "label",
        value: "label",
        binding: { kind: "simple-path", segments: ["label"] }
      }],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const root = document.createElement("div");
    root.appendChild(renderIRNode(node, {
      label,
      __components: { Child }
    })!);

    expect(root.textContent).toBe("First");
    expect(setupRuns).toBe(1);

    label.set("Second");
    await tick();

    expect(root.textContent).toBe("Second");
    expect(setupRuns).toBe(1);
  });

  it("keeps compiled module rendering detached from an owning template effect", async () => {
    const label = signal("First");
    const ir: IRModule = {
      filePath: "/pages/layout.tera",
      template: [{
        type: "interp",
        expression: "label",
        loc: undefined,
        flags: { dynamic: true }
      } as IRInterpolationNode],
      meta: {},
      route: null
    };
    let outerRuns = 0;
    let fragment = document.createDocumentFragment();

    const owner = effect(() => {
      outerRuns += 1;
      fragment = renderIRModuleToFragment(ir, { label });
    });

    expect(outerRuns).toBe(1);
    expect(fragment?.textContent).toBe("First");

    label.set("Second");
    await tick();

    expect(outerRuns).toBe(1);
    expect(fragment?.textContent).toBe("Second");
    dispose(owner);
  });

  it("keeps lowercase native tags as elements even when helpers share the same name", () => {
    const node: IRElementNode = {
      type: "element",
      tag: "code",
      props: [],
      children: [
        {
          type: "interp",
          expression: "label()",
          loc: undefined,
          flags: { dynamic: true }
        } as IRInterpolationNode
      ],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const dom = renderIRNode(node, {
      code: () => "helper should not replace <code>",
      label: () => "native code tag"
    }) as HTMLElement;

    expect(dom.tagName.toLowerCase()).toBe("code");
    expect(dom.textContent).toBe("native code tag");
  });

  it("runs nested component lifecycle hooks when the rendered node is attached and removed", async () => {
    let mounted = 0;
    let unmounted = 0;

    const Child = component({ name: "Child" }, () => {
      onMounted(() => {
        mounted += 1;
      });

      onUnmounted(() => {
        unmounted += 1;
      });

      const el = document.createElement("section");
      el.textContent = "Lifecycle child";
      return el;
    });

    const node: IRElementNode = {
      type: "element",
      tag: "Child",
      props: [],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const host = document.createElement("div");
    const dom = renderIRNode(node, {
      __components: { Child }
    })!;

    host.appendChild(dom);
    await tick();

    expect(mounted).toBe(1);

    clear(host);

    expect(unmounted).toBe(1);
  });
});

