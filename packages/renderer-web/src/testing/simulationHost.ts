import type { RendererEventHandler, RendererHost } from "@terajs/renderer";

export type SimulationNode =
  | SimulationAnchorNode
  | SimulationElementNode
  | SimulationFragmentNode
  | SimulationTextNode;

type SimulationBaseNode = {
  children: SimulationNode[];
  cleanups: Array<() => void>;
  kind: string;
  parent: SimulationNode | null;
};

export type SimulationAnchorNode = SimulationBaseNode & {
  kind: "anchor";
  label: string;
};

export type SimulationElementNode = SimulationBaseNode & {
  events: Record<string, RendererEventHandler[]>;
  kind: "element";
  props: Record<string, unknown>;
  styles: Record<string, string>;
  tag: string;
};

export type SimulationFragmentNode = SimulationBaseNode & {
  kind: "fragment";
};

export type SimulationTextNode = SimulationBaseNode & {
  data: string;
  kind: "text";
};

export function nextSimulationTick(): Promise<void> {
  return Promise.resolve();
}

export function createSimulationHost(): RendererHost<
  SimulationNode,
  SimulationElementNode,
  SimulationTextNode,
  SimulationFragmentNode
> {
  function createBaseNode<Kind extends SimulationNode["kind"]>(
    kind: Kind
  ): SimulationBaseNode & { kind: Kind } {
    return {
      kind,
      parent: null,
      children: [],
      cleanups: []
    } as SimulationBaseNode & { kind: Kind };
  }

  function detach(node: SimulationNode): void {
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

  function disposeNode(node: SimulationNode): void {
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
        label
      };
    },
    createElement(type) {
      return {
        ...createBaseNode("element"),
        tag: type,
        props: {},
        styles: {},
        events: {}
      };
    },
    createText(value) {
      return {
        ...createBaseNode("text"),
        data: String(value)
      };
    },
    createFragment() {
      return {
        ...createBaseNode("fragment")
      };
    },
    isNode(value): value is SimulationNode {
      return typeof value === "object" && value !== null && "kind" in value;
    },
    isFragment(node): node is SimulationFragmentNode {
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

export function simulationTextContent(node: SimulationNode): string {
  if (node.kind === "text") {
    return node.data;
  }

  if (node.kind === "anchor") {
    return "";
  }

  return node.children.map((child) => simulationTextContent(child)).join("");
}

export function simulationElementChildren(node: SimulationNode): SimulationElementNode[] {
  return node.children.filter(
    (child): child is SimulationElementNode => child.kind === "element"
  );
}