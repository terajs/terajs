import type {
  IRNode,
  IRSlotScopeBinding,
  IRSlotTemplateNode
} from "@terajs/compiler";
import {
  getCurrentContext,
  runWithCurrentContext
} from "@terajs/runtime";

import { createFragment, insert } from "./dom.js";

type RenderIRNode = (node: IRNode, ctx: any, isSvg?: boolean) => Node | null;

export interface ComponentSlotDefinition {
  children: IRNode[];
  bindings: IRSlotScopeBinding[];
  assignedSlotName?: string;
}

export function partitionComponentSlotChildren(children: IRNode[]): {
  defaultSlot?: ComponentSlotDefinition;
  namedSlots: Map<string, ComponentSlotDefinition>;
} {
  const defaultChildren: IRNode[] = [];
  const namedSlots = new Map<string, ComponentSlotDefinition>();
  let defaultSlot: ComponentSlotDefinition | undefined;

  for (const child of children) {
    if (child.type === "slot-template") {
      const definition = createScopedSlotDefinition(child);
      if (child.name === "default") {
        defaultSlot = definition;
      } else {
        namedSlots.set(child.name, definition);
      }
      continue;
    }

    const slotName = resolveAssignedSlotName(child);
    if (!slotName) {
      defaultChildren.push(child);
      continue;
    }

    const definition = namedSlots.get(slotName) ?? {
      children: [],
      bindings: [],
      assignedSlotName: slotName
    };
    definition.children.push(child);
    namedSlots.set(slotName, definition);
  }

  if (!defaultSlot && hasMeaningfulSlotContent(defaultChildren)) {
    defaultSlot = {
      children: defaultChildren,
      bindings: []
    };
  }

  return { defaultSlot, namedSlots };
}

export function createComponentSlotFactory(
  definition: ComponentSlotDefinition,
  ctx: any,
  isSvg: boolean,
  renderIRNode: RenderIRNode
): (slotProps?: Record<string, unknown>) => DocumentFragment {
  const ownerContext = getCurrentContext();

  return (slotProps = {}) => {
    const render = () => renderComponentSlot(
      definition,
      createScopedSlotContext(ctx, definition.bindings, slotProps),
      isSvg,
      renderIRNode
    );

    return ownerContext
      ? runWithCurrentContext(ownerContext, render)
      : render();
  };
}

function renderComponentSlot(
  definition: ComponentSlotDefinition,
  ctx: any,
  isSvg: boolean,
  renderIRNode: RenderIRNode
): DocumentFragment {
  const frag = createFragment();

  for (const child of definition.children) {
    const dom = renderIRNode(child, ctx, isSvg);
    if (dom) {
      if (definition.assignedSlotName) {
        removeAssignedSlotAttribute(dom, definition.assignedSlotName);
      }
      insert(frag, dom);
    }
  }

  return frag;
}

function createScopedSlotDefinition(node: IRSlotTemplateNode): ComponentSlotDefinition {
  return {
    children: node.children,
    bindings: node.bindings
  };
}

function createScopedSlotContext(
  parentContext: any,
  bindings: IRSlotScopeBinding[],
  slotProps: Record<string, unknown>
): any {
  if (bindings.length === 0) {
    return parentContext;
  }

  const scopedContext = Object.create(parentContext ?? null);
  for (const binding of bindings) {
    Object.defineProperty(scopedContext, binding.local, {
      configurable: true,
      enumerable: true,
      get: () => slotProps[binding.prop]
    });
  }

  return scopedContext;
}

function hasMeaningfulSlotContent(nodes: IRNode[]): boolean {
  return nodes.some((node) => node.type !== "text" || node.value.trim().length > 0);
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
