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
  IRSlotTemplateNode,
  IRIfNode,
  IRForNode
} from "@terajs/compiler";

import { batch, computed, dispose, effect, ref, signal } from "@terajs/reactivity";
import { component, onMounted, onUnmounted } from "@terajs/runtime";
import { clearDebugHistory, readDebugHistory } from "@terajs/shared";
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

  it("keeps scoped slot locals live across retained keyed rows", async () => {
    const items = signal([
      { id: "a", label: "A", visible: true, tags: ["one"] },
      { id: "b", label: "B", visible: true, tags: ["two"] }
    ]);
    const selected: string[] = [];
    const outlet: IRSlotNode = {
      type: "slot",
      name: "default",
      props: [{
        kind: "bind",
        name: "item",
        value: "item",
        binding: { kind: "simple-path", segments: ["item"] }
      }, {
        kind: "bind",
        name: "index",
        value: "i",
        binding: { kind: "simple-path", segments: ["i"] }
      }],
      fallback: [{ type: "text", value: "Fallback" } as IRTextNode],
      loc: undefined,
      flags: { dynamic: true }
    };
    const list: IRForNode = {
      type: "for",
      each: "items",
      item: "item",
      index: "i",
      isStructural: true,
      body: [{
        type: "element",
        tag: "div",
        props: [{
          kind: "bind",
          name: "key",
          value: "item.id",
          binding: { kind: "simple-path", segments: ["item", "id"] }
        }],
        children: [outlet],
        loc: undefined,
        flags: { hasDirectives: true }
      } as IRElementNode],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const VirtualScroller = component({ name: "VirtualScroller" }, (props: any) => {
      const slots = {
        ...(props.slots ?? {}),
        ...(props.children ? { default: props.children } : {})
      };
      return renderIRNode(list, {
        items: () => props.items,
        slots
      })!;
    });
    const RowBadge = component({ name: "RowBadge" }, (props: any) => () => {
      const badge = document.createElement("strong");
      badge.textContent = `[${props.label}]`;
      return badge;
    });
    const slotTemplate: IRSlotTemplateNode = {
      type: "slot-template",
      name: "default",
      bindings: [
        { prop: "item", local: "row" },
        { prop: "index", local: "position" }
      ],
      children: [{
        type: "if",
        condition: "row.visible",
        then: [{
          type: "element",
          tag: "article",
          props: [],
          children: [{
            type: "element",
            tag: "button",
            props: [{
              kind: "event",
              name: "click",
              value: "choose(row.id, position)"
            }],
            children: [{
              type: "interp",
              expression: "row.label",
              binding: { kind: "simple-path", segments: ["row", "label"] },
              loc: undefined,
              flags: { dynamic: true }
            } as IRInterpolationNode],
            loc: undefined,
            flags: { hasDirectives: false }
          } as IRElementNode, {
            type: "element",
            tag: "RowBadge",
            props: [{
              kind: "bind",
              name: "label",
              value: "row.label",
              binding: { kind: "simple-path", segments: ["row", "label"] }
            }],
            children: [],
            loc: undefined,
            flags: { hasDirectives: false }
          } as IRElementNode, {
            type: "for",
            each: "row.tags",
            item: "tag",
            isStructural: true,
            body: [{
              type: "element",
              tag: "span",
              props: [],
              children: [{
                type: "interp",
                expression: "tag",
                binding: { kind: "simple-path", segments: ["tag"] },
                loc: undefined,
                flags: { dynamic: true }
              } as IRInterpolationNode],
              loc: undefined,
              flags: {}
            } as IRElementNode],
            loc: undefined,
            flags: { hasDirectives: true }
          } as IRForNode],
          loc: undefined,
          flags: {}
        } as IRElementNode],
        else: [{ type: "text", value: "Hidden" } as IRTextNode],
        loc: undefined,
        flags: { hasDirectives: true }
      } as IRIfNode],
      loc: undefined,
      flags: { dynamic: true }
    };
    const consumer: IRElementNode = {
      type: "element",
      tag: "VirtualScroller",
      props: [{
        kind: "bind",
        name: "items",
        value: "items",
        binding: { kind: "simple-path", segments: ["items"] }
      }],
      children: [slotTemplate],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const root = document.createElement("div");
    root.appendChild(renderIRNode(consumer, {
      items,
      choose: (id: string, index: number) => selected.push(`${id}:${index}`),
      __components: { VirtualScroller, RowBadge }
    })!);
    const firstRow = root.children[0];
    const secondRow = root.children[1];

    expect(root.textContent).toBe("A[A]oneB[B]two");

    items.set([
      { id: "b", label: "B2", visible: true, tags: ["two", "three"] },
      { id: "a", label: "A2", visible: false, tags: [] }
    ]);
    await tick();

    expect(root.children[0]).toBe(secondRow);
    expect(root.children[1]).toBe(firstRow);
    expect(root.textContent).toBe("B2[B2]twothreeHidden");

    (root.querySelector("button") as HTMLButtonElement).click();
    expect(selected).toEqual(["b:0"]);
  });

  it("passes values to named scoped slots and preserves fallback content", () => {
    const namedSlot: IRSlotNode = {
      type: "slot",
      name: "header",
      props: [{
        kind: "bind",
        name: "title",
        value: "title",
        binding: { kind: "simple-path", segments: ["title"] }
      }],
      fallback: [{ type: "text", value: "Fallback heading" } as IRTextNode],
      loc: undefined,
      flags: { dynamic: true }
    };
    const HeaderHost = component({ name: "HeaderHost" }, (props: any) =>
      renderIRNode(namedSlot, {
        title: () => props.title,
        slots: props.slots
      })!
    );
    const projected: IRElementNode = {
      type: "element",
      tag: "HeaderHost",
      props: [{ kind: "static", name: "title", value: "Records" }],
      children: [{
        type: "slot-template",
        name: "header",
        bindings: [{ prop: "title", local: "heading" }],
        children: [{
          type: "element",
          tag: "h2",
          props: [],
          children: [{
            type: "interp",
            expression: "heading",
            binding: { kind: "simple-path", segments: ["heading"] },
            loc: undefined,
            flags: { dynamic: true }
          } as IRInterpolationNode],
          loc: undefined,
          flags: {}
        } as IRElementNode],
        loc: undefined,
        flags: { dynamic: true }
      } as IRSlotTemplateNode],
      loc: undefined,
      flags: {}
    };
    const fallback: IRElementNode = {
      ...projected,
      children: []
    };

    expect(renderIRNode(projected, { __components: { HeaderHost } })?.textContent)
      .toBe("Records");
    expect(renderIRNode(fallback, { __components: { HeaderHost } })?.textContent)
      .toBe("Fallback heading");
  });

  it("routes a conditional literal child to its named component slot", async () => {
    const showBottomAction = signal(true);
    const defaultSlot: IRSlotNode = {
      type: "slot",
      name: "default",
      fallback: [],
      loc: undefined,
      flags: { dynamic: true }
    };
    const bottomSlot: IRSlotNode = {
      type: "slot",
      name: "bottom-action",
      fallback: [{
        type: "element",
        tag: "button",
        props: [{ kind: "static", name: "data-source-action", value: "fallback" }],
        children: [{ type: "text", value: "View source record" } as IRTextNode],
        loc: undefined,
        flags: {}
      } as IRElementNode],
      loc: undefined,
      flags: { dynamic: true }
    };
    const Pane = component({ name: "WorkspaceActionPane" }, (props: any) => {
      const slots = {
        ...(props.slots ?? {}),
        ...(props.children ? { default: props.children } : {})
      };
      const section = document.createElement("section");
      const body = document.createElement("main");
      const footer = document.createElement("footer");
      body.appendChild(renderIRNode(defaultSlot, { slots })!);
      footer.appendChild(renderIRNode(bottomSlot, { slots })!);
      section.append(body, footer);
      return section;
    });
    const consumer: IRElementNode = {
      type: "element",
      tag: "Pane",
      props: [],
      children: [{
        type: "element",
        tag: "p",
        props: [],
        children: [{ type: "text", value: "Issue details" } as IRTextNode],
        loc: undefined,
        flags: {}
      } as IRElementNode, {
        type: "if",
        condition: "showBottomAction",
        then: [{
          type: "element",
          tag: "div",
          props: [{ kind: "static", name: "slot", value: "bottom-action" }],
          children: [{
            type: "element",
            tag: "button",
            props: [{ kind: "static", name: "data-source-action", value: "projected" }],
            children: [{ type: "text", value: "View source record" } as IRTextNode],
            loc: undefined,
            flags: {}
          } as IRElementNode],
          loc: undefined,
          flags: {}
        } as IRElementNode],
        else: [],
        loc: undefined,
        flags: { hasDirectives: true }
      } as IRIfNode],
      loc: undefined,
      flags: {}
    };
    const root = document.createElement("div");
    root.appendChild(renderIRNode(consumer, {
      showBottomAction,
      __components: { Pane }
    })!);

    expect(root.querySelector("main")?.textContent).toBe("Issue details");
    expect(root.querySelector("main [data-source-action]")).toBeNull();
    expect(root.querySelector("footer [data-source-action='projected']")).not.toBeNull();
    expect(root.querySelector("footer [data-source-action='fallback']")).toBeNull();
    expect(root.querySelector("[slot]")).toBeNull();
    expect(root.querySelectorAll("[data-source-action]")).toHaveLength(1);

    showBottomAction.set(false);
    await tick();

    expect(root.querySelector("main")?.textContent).toBe("Issue details");
    expect(root.querySelectorAll("[data-source-action]")).toHaveLength(0);
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

  it("keeps keyed child prop bindings active across consecutive list updates", async () => {
    const activeIndex = signal(0);
    const steps = computed(() => ["company", "opening", "transactions"].map((key, index) => ({
      key,
      label: key,
      status: index < activeIndex()
        ? "complete"
        : index === activeIndex()
          ? "current"
          : "pending"
    })));
    const stepNode: IRElementNode = {
      type: "element",
      tag: "li",
      props: [{
        kind: "bind",
        name: "data-status",
        value: "step.get().status"
      }],
      children: [{
        type: "interp",
        expression: "step.get().label",
        loc: undefined,
        flags: { dynamic: true }
      } as IRInterpolationNode],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const Step = component({ name: "WorkflowStep" }, (props: any) => {
      const step = computed(() => props.step);
      return renderIRNode(stepNode, { step })!;
    });
    const listNode: IRForNode = {
      type: "for",
      each: "steps.get()",
      item: "step",
      isStructural: true,
      body: [{
        type: "element",
        tag: "Step",
        props: [{
          kind: "bind",
          name: "key",
          value: "step.key",
          binding: { kind: "simple-path", segments: ["step", "key"] }
        }, {
          kind: "bind",
          name: "step",
          value: "step",
          binding: { kind: "simple-path", segments: ["step"] }
        }],
        children: [],
        loc: undefined,
        flags: { hasDirectives: true }
      } as IRElementNode],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const root = document.createElement("ol");
    root.appendChild(renderIRNode(listNode, {
      steps,
      __components: { Step }
    })!);
    const statuses = () => Array.from(root.querySelectorAll("li"))
      .map((item) => item.getAttribute("data-status"));

    expect(statuses()).toEqual(["current", "pending", "pending"]);

    activeIndex.set(1);
    await tick();
    expect(statuses()).toEqual(["complete", "current", "pending"]);

    activeIndex.set(2);
    await tick();
    expect(statuses()).toEqual(["complete", "complete", "current"]);
  });

  it("does not evaluate lazy component props for debug history", () => {
    let propReads = 0;

    const Child = component({ name: "LazyPropChild" }, () => {
      const element = document.createElement("span");
      element.textContent = "Child";
      return element;
    });
    const node: IRElementNode = {
      type: "element",
      tag: "Child",
      props: [{
        kind: "bind",
        name: "state",
        value: "buildState()"
      }],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    renderIRNode(node, {
      buildState: () => {
        propReads += 1;
        return { ready: true };
      },
      __components: { Child }
    });

    expect(propReads).toBe(0);
  });

  it("mounts nested card groups once across retained keyed rows", () => {
    const readOnly = signal(true);
    const rows = signal(Array.from({ length: 5 }, (_, rowIndex) => ({
      key: `row-${rowIndex}`,
      cards: [
        { key: "reject", title: `Reject ${rowIndex}` },
        { key: "approve", title: `Approve ${rowIndex}` }
      ]
    })));
    let groupStateReads = 0;
    let cardStateReads = 0;

    const Card = component({ name: "ReviewChoiceCard" }, (props: any) => {
      const state = props.state;
      const element = document.createElement("label");
      element.textContent = state.title;
      return element;
    });
    const groupNode: IRElementNode = {
      type: "element",
      tag: "fieldset",
      props: [],
      children: [{
        type: "for",
        each: "cards",
        item: "card",
        isStructural: true,
        body: [{
          type: "element",
          tag: "span",
          props: [{
            kind: "bind",
            name: "key",
            value: "card.key",
            binding: { kind: "simple-path", segments: ["card", "key"] }
          }],
          children: [{
            type: "element",
            tag: "Card",
            props: [{
              kind: "bind",
              name: "state",
              value: "cardState(card)"
            }],
            children: [],
            loc: undefined,
            flags: { hasDirectives: false }
          } as IRElementNode],
          loc: undefined,
          flags: { hasDirectives: true }
        } as IRElementNode],
        loc: undefined,
        flags: { hasDirectives: true }
      } as IRForNode],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const Group = component({ name: "ReviewDecisionGroup" }, (props: any) => {
      const state = props.state;
      return renderIRNode(groupNode, {
        cards: state.cards,
        cardState: (card: unknown) => {
          cardStateReads += 1;
          return card;
        },
        __components: { Card }
      })!;
    });
    const tableNode: IRForNode = {
      type: "for",
      each: "rows",
      item: "row",
      isStructural: true,
      body: [{
        type: "element",
        tag: "article",
        props: [{
          kind: "bind",
          name: "key",
          value: "row.key",
          binding: { kind: "simple-path", segments: ["row", "key"] }
        }],
        children: [{
          type: "if",
          condition: "!readOnly()",
          then: [{
            type: "element",
            tag: "Group",
            props: [{
              kind: "bind",
              name: "state",
              value: "groupState(row)"
            }],
            children: [],
            loc: undefined,
            flags: { hasDirectives: false }
          } as IRElementNode],
          else: [],
          loc: undefined,
          flags: {}
        } as IRIfNode],
        loc: undefined,
        flags: { hasDirectives: true }
      } as IRElementNode],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const root = document.createElement("div");
    root.appendChild(renderIRNode(tableNode, {
      rows,
      readOnly,
      groupState: (row: { cards: unknown[] }) => {
        groupStateReads += 1;
        return row;
      },
      __components: { Group }
    })!);

    expect(root.querySelectorAll("article")).toHaveLength(5);
    expect(root.querySelectorAll("fieldset")).toHaveLength(0);

    batch(() => {
      readOnly.set(false);
    });

    expect(root.querySelectorAll("fieldset")).toHaveLength(5);
    expect(root.querySelectorAll("label")).toHaveLength(10);
    expect(groupStateReads).toBe(5);
    expect(cardStateReads).toBe(10);
  });

  it("toggles one conditional icon across two retained keyed cards", async () => {
    const selectedKey = signal("reject");
    const cards = [
      { key: "reject", title: "Reject", stampIcon: "close" },
      { key: "approve", title: "Approve", stampIcon: "check" }
    ];
    let iconMounts = 0;
    let iconUnmounts = 0;

    const Icon = component({ name: "DecisionStampIcon" }, () => {
      onMounted(() => {
        iconMounts += 1;
      });
      onUnmounted(() => {
        iconUnmounts += 1;
      });
      return document.createElement("i");
    });
    const cardNode: IRElementNode = {
      type: "element",
      tag: "label",
      props: [],
      children: [{
        type: "if",
        condition: "selected.get() && card.stampIcon",
        then: [{
          type: "element",
          tag: "Icon",
          props: [],
          children: [],
          loc: undefined,
          flags: { hasDirectives: false }
        } as IRElementNode],
        else: [],
        loc: undefined,
        flags: {}
      } as IRIfNode, {
        type: "interp",
        expression: "card.title",
        loc: undefined,
        flags: { dynamic: true }
      } as IRInterpolationNode],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const Card = component({ name: "DecisionToggleCard" }, (props: any) => {
      const card = props.card;
      const selected = computed(() => selectedKey() === card.key);
      return renderIRNode(cardNode, {
        card,
        selected,
        __components: { Icon }
      })!;
    });
    const groupNode: IRForNode = {
      type: "for",
      each: "cards",
      item: "card",
      isStructural: true,
      body: [{
        type: "element",
        tag: "span",
        props: [{
          kind: "bind",
          name: "key",
          value: "card.key",
          binding: { kind: "simple-path", segments: ["card", "key"] }
        }],
        children: [{
          type: "element",
          tag: "Card",
          props: [{
            kind: "bind",
            name: "card",
            value: "card",
            binding: { kind: "simple-path", segments: ["card"] }
          }],
          children: [],
          loc: undefined,
          flags: { hasDirectives: false }
        } as IRElementNode],
        loc: undefined,
        flags: { hasDirectives: true }
      } as IRElementNode],
      loc: undefined,
      flags: { hasDirectives: true }
    };
    const root = document.createElement("div");
    root.appendChild(renderIRNode(groupNode, {
      cards,
      __components: { Card }
    })!);
    await tick();

    const originalCards = Array.from(root.querySelectorAll("label"));
    expect(root.querySelectorAll("i")).toHaveLength(1);
    expect(iconMounts).toBe(1);
    clearDebugHistory();

    batch(() => {
      selectedKey.set("approve");
    });
    await tick();

    expect(Array.from(root.querySelectorAll("label"))).toEqual(originalCards);
    expect(root.querySelectorAll("i")).toHaveLength(1);
    expect(iconMounts).toBe(2);
    expect(iconUnmounts).toBe(1);
    expect(readDebugHistory().map((event) => event.type)).toEqual([
      "reactive:updated",
      "component:mounted",
      "component:unmounted"
    ]);
    clearDebugHistory();
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

