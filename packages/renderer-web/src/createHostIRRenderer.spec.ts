import { describe, expect, it } from "vitest";

import type {
  IRElementNode,
  IRForNode,
  IRIfNode,
  IRInterpolationNode,
  IRTextNode,
} from "@terajs/compiler";
import type { RendererHost } from "@terajs/renderer";
import { signal } from "@terajs/reactivity";

import { createHostBindings } from "./hostBindings.js";
import { createHostIRRenderer } from "./createHostIRRenderer.js";

type SimNode = SimAnchorNode | SimElementNode | SimFragmentNode | SimTextNode;

type SimBaseNode = {
  children: SimNode[];
  cleanups: Array<() => void>;
  kind: string;
  parent: SimNode | null;
};

type SimAnchorNode = SimBaseNode & {
  kind: "anchor";
  label: string;
};

type SimElementNode = SimBaseNode & {
  events: Record<string, Array<(...args: any[]) => unknown>>;
  kind: "element";
  props: Record<string, unknown>;
  styles: Record<string, string>;
  tag: string;
};

type SimFragmentNode = SimBaseNode & {
  kind: "fragment";
};

type SimTextNode = SimBaseNode & {
  data: string;
  kind: "text";
};

const tick = () => Promise.resolve();

describe("createHostIRRenderer", () => {
  it("renders and updates interpolation against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const label = signal("alpha");
    const node: IRInterpolationNode = {
      type: "interp",
      expression: "label",
      loc: undefined,
      flags: { dynamic: true }
    };

    const rendered = renderer.renderIRNode(node, { label }) as SimTextNode;
    expect(rendered.data).toBe("alpha");

    label.set("beta");
    await tick();

    expect(rendered.data).toBe("beta");
  });

  it("renders elements with reactive props and event handlers against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const title = signal("alpha");
    let clicked = false;
    const node: IRElementNode = {
      type: "element",
      tag: "button",
      props: [
        {
          kind: "bind",
          name: "title",
          value: "title",
          binding: {
            kind: "simple-path",
            segments: ["title"]
          }
        },
        {
          kind: "event",
          name: "click",
          value: "onClick"
        }
      ],
      children: [],
      loc: undefined,
      flags: { hasDirectives: false }
    };

    const rendered = renderer.renderIRNode(node, {
      title,
      onClick: () => {
        clicked = true;
      }
    }) as SimElementNode;

    expect(rendered.props.title).toBe("alpha");

    title.set("beta");
    await tick();

    expect(rendered.props.title).toBe("beta");
    rendered.events.click[0]?.();
    expect(clicked).toBe(true);
  });

  it("updates and disposes if-branch effects against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

    const root = host.createElement("root");
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

    const rendered = renderer.renderIRNode(node, { show, count }) as SimNode;
    host.insert(root, rendered);

    const removedText = root.children.find((child) => child.kind === "text") as SimTextNode;
    expect(simTextContent(root)).toBe("1");

    show.set(false);
    await tick();
    expect(simTextContent(root)).toBe("");

    count.set(2);
    await tick();
    expect(removedText.data).toBe("1");
  });

  it("renders reactive for nodes against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

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

    const root = host.createElement("root");
    const rendered = renderer.renderIRNode(node, { items }) as SimNode;
    host.insert(root, rendered);

    expect(simTextContent(root)).toBe("12");

    items.set([3, 4, 5]);
    await tick();

    expect(simTextContent(root)).toBe("345");
  });

  it("reuses keyed row nodes against a non-DOM host", async () => {
    const host = createSimulationHost();
    const renderer = createHostIRRenderer({
      host,
      bindings: createHostBindings(host)
    });

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

    const root = host.createElement("root");
    const rendered = renderer.renderIRNode(node, { items }) as SimNode;
    host.insert(root, rendered);

    const initialRows = simElementChildren(root);
    const firstNode = initialRows[0];
    const secondNode = initialRows[1];

    expect(simTextContent(root)).toBe("AB");

    items.set([
      { id: "b", label: "B2" },
      { id: "a", label: "A" }
    ]);
    await tick();

    const reorderedRows = simElementChildren(root);
    expect(simTextContent(root)).toBe("B2A");
    expect(reorderedRows[0]).toBe(secondNode);
    expect(reorderedRows[1]).toBe(firstNode);
  });
});

function createSimulationHost(): RendererHost<SimNode, SimElementNode, SimTextNode, SimFragmentNode> {
  function createBaseNode<Kind extends SimNode["kind"]>(kind: Kind): SimBaseNode & { kind: Kind } {
    return {
      kind,
      parent: null,
      children: [],
      cleanups: []
    } as SimBaseNode & { kind: Kind };
  }

  function detach(node: SimNode): void {
    const parent = node.parent;
    if (!parent) {
      return;
    }

    const index = parent.children.indexOf(node);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }

    node.parent = null;
  }

  function disposeNode(node: SimNode): void {
    for (const child of [...node.children]) {
      disposeNode(child);
    }

    for (const cleanup of node.cleanups.splice(0, node.cleanups.length)) {
      cleanup();
    }
  }

  return {
    createAnchor(label = "") {
      return {
        ...createBaseNode("anchor"),
        label,
      };
    },
    createElement(type) {
      return {
        ...createBaseNode("element"),
        tag: type,
        props: {},
        styles: {},
        events: {},
      };
    },
    createText(value) {
      return {
        ...createBaseNode("text"),
        data: String(value),
      };
    },
    createFragment() {
      return {
        ...createBaseNode("fragment"),
      };
    },
    isNode(value): value is SimNode {
      return typeof value === "object" && value !== null && "kind" in value;
    },
    isFragment(node): node is SimFragmentNode {
      return node.kind === "fragment";
    },
    getParent(node) {
      return node.parent;
    },
    getNextSibling(node) {
      const parent = node.parent;
      if (!parent) {
        return null;
      }

      const index = parent.children.indexOf(node);
      return index >= 0 ? parent.children[index + 1] ?? null : null;
    },
    getChildren(node) {
      return [...node.children];
    },
    insert(parent, child, anchor = null) {
      if (child.kind === "fragment") {
        const children = [...child.children];
        child.children.length = 0;
        for (const fragmentChild of children) {
          this.insert(parent, fragmentChild, anchor);
        }
        return;
      }

      detach(child);

      const anchorIndex = anchor ? parent.children.indexOf(anchor) : -1;
      if (anchorIndex >= 0) {
        parent.children.splice(anchorIndex, 0, child);
      } else {
        parent.children.push(child);
      }

      child.parent = parent;
    },
    remove(node) {
      disposeNode(node);
      detach(node);
    },
    setText(node, value) {
      node.data = String(value);
    },
    setProp(el, name, value) {
      if (value == null || value === false) {
        delete el.props[name];
        return;
      }

      el.props[name] = value === true ? "" : value;
    },
    setStyle(el, style) {
      el.styles = { ...el.styles, ...style };
    },
    setClass(el, className) {
      el.props.class = className;
    },
    addEvent(el, name, handler) {
      el.events[name] ??= [];
      el.events[name].push(handler);
    },
    removeEvent(el, name, handler) {
      const current = el.events[name];
      if (!current) {
        return;
      }

      el.events[name] = current.filter((candidate) => candidate !== handler);
    },
    addNodeCleanup(node, cleanup) {
      node.cleanups.push(cleanup);
    }
  };
}

function simTextContent(node: SimNode): string {
  if (node.kind === "text") {
    return node.data;
  }

  if (node.kind === "anchor") {
    return "";
  }

  return node.children.map((child) => simTextContent(child)).join("");
}

function simElementChildren(node: SimNode): SimElementNode[] {
  return node.children.filter((child): child is SimElementNode => child.kind === "element");
}
