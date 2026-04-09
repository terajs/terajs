/**
 * @file renderFromIR.ts
 * @description
 * Reactive client-side DOM renderer for Terajs's IR.
 */

import type {
  IRModule,
  IRNode,
  IRTextNode,
  IRInterpolationNode,
  IRElementNode,
  IRPortalNode,
  IRSlotNode,
  IRIfNode,
  IRForNode,
  IRPropNode,
} from "@terajs/compiler";

import {
  createElement,
  createText,
  createFragment,
  insert,
  remove,
  addNodeCleanup,
} from "./dom";

import {
  bindText,
  bindProp,
  bindClass,
  bindStyle,
  bindEvent,
} from "./bindings";

import { dispose, effect } from "@terajs/reactivity";
import { Debug } from "@terajs/shared";
import { Portal as WebPortal } from "./portal";

/* -------------------------------------------------------------------------- */
/*                             PUBLIC ENTRY POINTS                            */
/* -------------------------------------------------------------------------- */

export function renderIRModuleToFragment(ir: IRModule, ctx: any): DocumentFragment {
  Debug.emit("ir:render:module", { filePath: ir.filePath });

  const frag = createFragment();

  for (const node of ir.template) {
    const dom = renderIRNode(node, ctx);
    if (dom) insert(frag, dom);
  }

  return frag;
}

export function renderIRNode(node: IRNode, ctx: any, isSvg: boolean = false): Node | null {
  switch (node.type) {
    case "text":
      return renderIRText(node);
    case "interp":
      return renderIRInterpolation(node, ctx);
    case "element":
      return renderIRElement(node, ctx, isSvg);
    case "portal":
      return renderIRPortal(node, ctx, isSvg);
    case "slot":
      return renderIRSlot(node, ctx, isSvg);
    case "if":
      return renderIRIf(node, ctx, isSvg);
    case "for":
      return renderIRFor(node, ctx, isSvg);
    default:
      Debug.emit("error:renderer", { message: "Unknown IR node", node });
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   TEXT                                     */
/* -------------------------------------------------------------------------- */

function renderIRText(node: IRTextNode): Text {
  Debug.emit("ir:render:text", { value: node.value });
  return createText(node.value);
}

/* -------------------------------------------------------------------------- */
/*                              INTERPOLATION                                 */
/* -------------------------------------------------------------------------- */

function renderIRInterpolation(node: IRInterpolationNode, ctx: any): Text {
  Debug.emit("ir:render:interp", { expression: node.expression });

  const text = createText("");

  bindText(text, () => resolveExpr(ctx, node.expression));

  return text;
}

/* -------------------------------------------------------------------------- */
/*                                  ELEMENT                                   */
/* -------------------------------------------------------------------------- */

function renderIRElement(node: IRElementNode, ctx: any, isSvg: boolean): Element {
  Debug.emit("ir:render:element", { tag: node.tag, svg: isSvg });

  const nextSvg = isSvg || node.tag === "svg";
  const el = createElement(node.tag, nextSvg);

  applyIRProps(el, node.props, ctx);

  for (const child of node.children) {
    const dom = renderIRNode(child, ctx, nextSvg);
    if (dom) insert(el, dom);
  }

  return el;
}

function renderIRPortal(node: IRPortalNode, ctx: any, isSvg: boolean): Node {
  Debug.emit("ir:render:portal", {
    hasTarget: node.target != null
  });

  return WebPortal({
    to: resolvePortalTarget(node.target, ctx),
    children: node.children.map((child) => renderIRNode(child, ctx, isSvg))
  });
}

function renderIRSlot(node: IRSlotNode, ctx: any, isSvg: boolean): Node {
  Debug.emit("ir:render:slot", { name: node.name ?? "default" });

  const slotName = node.name ?? "default";
  const slotValue = ctx?.slots?.[slotName];

  if (slotValue != null) {
    return normalizeSlotValue(slotValue);
  }

  const frag = createFragment();
  for (const child of node.fallback) {
    const dom = renderIRNode(child, ctx, isSvg);
    if (dom) {
      insert(frag, dom);
    }
  }
  return frag;
}

function applyIRProps(el: Element, props: IRPropNode[], ctx: any): void {
  for (const p of props) {
    switch (p.kind) {
      case "static":
        applyStaticProp(el, p);
        break;

      case "bind":
        applyBindProp(el, p, ctx);
        break;

      case "event":
        applyEventProp(el, p, ctx);
        break;

      default:
        Debug.emit("ir:render:prop:skip", p);
    }
  }
}

function applyStaticProp(el: Element, p: IRPropNode): void {
  if (p.name === "class") {
    if (el instanceof HTMLElement) {
      el.className = String(p.value ?? "");
      return;
    }
  } else if (p.name === "style" && typeof p.value === "object") {
    const styleObj = p.value as Record<string, any>;
    const styleTarget = (el as HTMLElement | SVGElement).style;
    for (const key in styleObj) {
      styleTarget[key as any] = String(styleObj[key]);
    }
    return;
  }

  if (p.value != null) el.setAttribute(p.name, String(p.value));
}

function applyBindProp(el: Element, p: IRPropNode, ctx: any): void {
  const expr = String(p.value);

  if (p.name === "class") {
    bindClass(el, () => resolveExpr(ctx, expr));
    return;
  }

  if (p.name === "style") {
    bindStyle(el, () => {
      const v = resolveExpr(ctx, expr);

      if (typeof v === "string") return { color: v };

      return v || {};
    });
    return;
  }

  bindProp(el, p.name, () => resolveExpr(ctx, expr));
}

function applyEventProp(el: Element, p: IRPropNode, ctx: any): void {
  const handler = resolveExpr(ctx, String(p.value));

  if (typeof handler === "function") {
    bindEvent(el, p.name, handler);
  } else {
    Debug.emit("error:renderer", {
      message: `Event handler '${p.value}' is not a function`,
      value: handler,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                                    IF                                      */
/* -------------------------------------------------------------------------- */

function renderIRIf(node: IRIfNode, ctx: any, isSvg: boolean): Node {
  Debug.emit("ir:render:if", { condition: node.condition });

  const anchor = document.createComment("if");
  const parent = createFragment();
  parent.appendChild(anchor);

  const effectFn = effect(() => {
    const condition = !!resolveExpr(ctx, node.condition);
    const branch = condition ? node.then : node.else ?? [];

    // Remove old nodes
    let next = anchor.nextSibling;
    while (next) {
      const toRemove = next;
      next = next.nextSibling;
      remove(toRemove);
    }

    // Insert new nodes in correct order
    let ref: ChildNode | null = anchor.nextSibling;
    for (const child of branch) {
      const dom = renderIRNode(child, ctx, isSvg);
      if (dom) {
        insert(parent, dom, ref ?? null);
        ref = null;
      }
    }
  });

  addNodeCleanup(anchor, () => dispose(effectFn));

  return parent;
}

/* -------------------------------------------------------------------------- */
/*                                    FOR                                     */
/* -------------------------------------------------------------------------- */

function renderIRFor(node: IRForNode, ctx: any, isSvg: boolean): Node {
  Debug.emit("ir:render:for", { each: node.each });

  const anchor = document.createComment("for");
  const parent = createFragment();
  parent.appendChild(anchor);

  const effectFn = effect(() => {
    const array = resolveExpr(ctx, node.each) || [];
    const nodes: Node[] = [];

    for (let i = 0; i < array.length; i++) {
      const childCtx = {
        ...ctx,
        [node.item]: array[i],
        [node.index ?? "i"]: i,
      };

      const frag = createFragment();
      for (const child of node.body) {
        const dom = renderIRNode(child, childCtx, isSvg);
        if (dom) frag.appendChild(dom);
      }

      nodes.push(frag);
    }

    // Clear old
    let next = anchor.nextSibling;
    while (next) {
      const toRemove = next;
      next = next.nextSibling;
      remove(toRemove);
    }

    // Insert new in correct order
    let ref: ChildNode | null = anchor.nextSibling;
    for (const n of nodes) {
      insert(parent, n, ref ?? null);
      ref = null;
    }
  });

  addNodeCleanup(anchor, () => dispose(effectFn));

  return parent;
}

/* -------------------------------------------------------------------------- */
/*                             EXPRESSION RESOLUTION                          */
/* -------------------------------------------------------------------------- */

function resolveExpr(ctx: any, expr: string): any {
  if (!ctx) return undefined;

  if (expr in ctx) {
    const raw = ctx[expr];
    return typeof raw === "function" ? raw() : raw;
  }

  const parts = expr.split(".");
  let current: any = ctx;

  for (const part of parts) {
    if (current == null) return undefined;
    const value = current[part];
    current = typeof value === "function" ? value() : value;
  }

  return current;
}

function resolvePortalTarget(target: IRPropNode | undefined, ctx: any): any {
  if (!target) {
    return undefined;
  }

  if (target.kind === "bind") {
    return resolveExpr(ctx, String(target.value));
  }

  return target.value;
}

function normalizeSlotValue(value: any): Node {
  if (typeof value === "function") {
    return normalizeSlotValue(value());
  }

  if (value == null || value === false || value === true) {
    return createFragment();
  }

  if (value instanceof Node) {
    return value;
  }

  if (Array.isArray(value)) {
    const frag = createFragment();
    for (const item of value) {
      insert(frag, normalizeSlotValue(item));
    }
    return frag;
  }

  return createText(String(value));
}

