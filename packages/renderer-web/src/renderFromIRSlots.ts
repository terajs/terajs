import type { IRNode } from "@terajs/compiler";

import { createFragment, insert } from "./dom.js";

type RenderIRNode = (node: IRNode, ctx: any, isSvg?: boolean) => Node | null;

export function partitionComponentSlotChildren(children: IRNode[]): {
  defaultChildren: IRNode[];
  namedChildren: Map<string, IRNode[]>;
} {
  const defaultChildren: IRNode[] = [];
  const namedChildren = new Map<string, IRNode[]>();

  for (const child of children) {
    const slotName = resolveAssignedSlotName(child);
    if (!slotName) {
      defaultChildren.push(child);
      continue;
    }

    const entries = namedChildren.get(slotName) ?? [];
    entries.push(child);
    namedChildren.set(slotName, entries);
  }

  return { defaultChildren, namedChildren };
}

export function createComponentSlotFactory(
  children: IRNode[],
  ctx: any,
  isSvg: boolean,
  renderIRNode: RenderIRNode,
  assignedSlotName?: string
): () => DocumentFragment {
  return () => {
    const frag = createFragment();

    for (const child of children) {
      const dom = renderIRNode(child, ctx, isSvg);
      if (dom) {
        if (assignedSlotName) {
          removeAssignedSlotAttribute(dom, assignedSlotName);
        }
        insert(frag, dom);
      }
    }

    return frag;
  };
}

function resolveAssignedSlotName(node: IRNode): string | null {
  if (node.type === "element") {
    const slotProp = node.props.find((prop) =>
      prop.kind === "static"
      && prop.name === "slot"
      && typeof prop.value === "string"
      && prop.value.trim().length > 0
    );
    return typeof slotProp?.value === "string" ? slotProp.value.trim() : null;
  }

  if (node.type === "if") {
    const thenSlot = resolveCommonAssignedSlotName(node.then);
    if (!thenSlot) {
      return null;
    }

    const elseSlot = node.else?.length
      ? resolveCommonAssignedSlotName(node.else)
      : thenSlot;
    return elseSlot === thenSlot ? thenSlot : null;
  }

  if (node.type === "for") {
    return resolveCommonAssignedSlotName(node.body);
  }

  return null;
}

function resolveCommonAssignedSlotName(nodes: IRNode[]): string | null {
  const meaningfulNodes = nodes.filter((node) =>
    node.type !== "text" || node.value.trim().length > 0
  );
  if (meaningfulNodes.length === 0) {
    return null;
  }

  const slotName = resolveAssignedSlotName(meaningfulNodes[0]);
  if (!slotName) {
    return null;
  }

  return meaningfulNodes.every((node) => resolveAssignedSlotName(node) === slotName)
    ? slotName
    : null;
}

function removeAssignedSlotAttribute(node: Node, slotName: string): void {
  if (node instanceof Element && node.getAttribute("slot") === slotName) {
    node.removeAttribute("slot");
    return;
  }

  if (node instanceof DocumentFragment) {
    for (const child of Array.from(node.childNodes)) {
      removeAssignedSlotAttribute(child, slotName);
    }
  }
}
