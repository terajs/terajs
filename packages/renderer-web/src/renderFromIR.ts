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
  IRBindingHint,
  IRElementNode,
  IRPortalNode,
  IRSlotNode,
  IRIfNode,
  IRPropNode,
} from "@terajs/compiler";

import {
  createElement,
  createText,
  createFragment,
  insert,
  remove,
  addNodeCleanup,
} from "./dom.js";
import { renderComponent, type FrameworkComponent } from "./render.js";
import {
  bindText,
  bindDirectTextSource,
  bindProp,
  bindDirectPropSource,
  bindClass,
  bindStyle,
  bindEvent,
} from "./bindings.js";

import { dispose, effect } from "@terajs/reactivity";
import { emitRendererDebug } from "./debug.js";
import { Portal as WebPortal } from "./portal.js";
import {
  isDirectBindingSource,
  resolveDirectTextSource,
  resolveEventHandler,
  resolveExpr,
  resolveHintedDirectSource,
  resolveHintedPath,
} from "./renderFromIRExpressions.js";
import { renderIRForNode } from "./renderFromIRFor.js";

/* -------------------------------------------------------------------------- */
/*                             PUBLIC ENTRY POINTS                            */
/* -------------------------------------------------------------------------- */

/**
 * Renders a compiled IR module into a detached document fragment.
 *
 * This is the primary bridge between compiler output and the web renderer.
 * It walks the module template, renders each IR node with the provided
 * execution context, and returns a fragment ready for insertion.
 *
 * @param ir - The compiled IR module produced by the compiler or SFC pipeline.
 * @param ctx - The runtime execution context used to resolve bindings, slots, and events.
 * @returns A document fragment containing the rendered module output.
 */
export function renderIRModuleToFragment(ir: IRModule, ctx: any): DocumentFragment {
  emitRendererDebug("ir:render:module", () => ({ filePath: ir.filePath }));

  const frag = createFragment();

  for (const node of ir.template) {
    const dom = renderIRNode(node, ctx);
    if (dom) {
      insert(frag, dom);
    }
  }

  return frag;
}

/**
 * Renders a single IR node into a DOM node.
 *
 * The renderer supports text, interpolation, element, portal, slot, `if`,
 * and `for` node kinds. Unknown node types emit a renderer error and return
 * `null` so callers can continue rendering surrounding output.
 *
 * @param node - The IR node to render.
 * @param ctx - The runtime execution context used to resolve bindings and slots.
 * @param isSvg - Whether the current render position is inside an SVG subtree.
 * @returns The rendered DOM node, or `null` when the node cannot be rendered.
 */
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
      return renderIRForNode(node, ctx, isSvg, renderIRNode);
    default:
      emitRendererDebug("error:renderer", () => ({ message: "Unknown IR node", node }));
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   TEXT                                     */
/* -------------------------------------------------------------------------- */

function renderIRText(node: IRTextNode): Text {
  emitRendererDebug("ir:render:text", () => ({ value: node.value }));
  return createText(node.value);
}

/* -------------------------------------------------------------------------- */
/*                              INTERPOLATION                                 */
/* -------------------------------------------------------------------------- */

function renderIRInterpolation(node: IRInterpolationNode, ctx: any): Text {
  emitRendererDebug("ir:render:interp", () => ({ expression: node.expression }));

  const text = createText("");

  const hintedBinding = node.binding;
  if (hintedBinding?.kind === "simple-path") {
    const directSource = resolveHintedDirectSource(ctx, hintedBinding);
    if (isDirectBindingSource(directSource)) {
      bindDirectTextSource(text, directSource);
      return text;
    }

    bindText(text, () => resolveHintedPath(ctx, hintedBinding, true));
    return text;
  }

  if (process.env.NODE_ENV === "production") {
    const directSource = resolveDirectTextSource(ctx, node.expression);
    if (isDirectBindingSource(directSource)) {
      bindDirectTextSource(text, directSource);
      return text;
    }
  }

  bindText(text, () => resolveExpr(ctx, node.expression));

  return text;
}

/* -------------------------------------------------------------------------- */
/*                                  ELEMENT                                   */
/* -------------------------------------------------------------------------- */

function renderIRElement(node: IRElementNode, ctx: any, isSvg: boolean): Element {
  const component = resolveComponentBinding(ctx, node.tag);
  if (component) {
    return renderIRComponent(node, component, ctx, isSvg) as Element;
  }

  emitRendererDebug("ir:render:element", () => ({ tag: node.tag, svg: isSvg }));

  const nextSvg = isSvg || node.tag === "svg";
  const el = createElement(node.tag, nextSvg);

  applyIRProps(el, node.props, ctx);

  for (const child of node.children) {
    const dom = renderIRNode(child, ctx, nextSvg);
    if (dom) {
      insert(el, dom);
    }
  }

  return el;
}

function renderIRComponent(
  node: IRElementNode,
  component: FrameworkComponent,
  ctx: any,
  isSvg: boolean
): Node {
  emitRendererDebug("ir:render:component", () => ({ tag: node.tag }));

  const props = buildComponentProps(node, ctx, isSvg);
  const rendered = renderComponent(component, props);
  const cleanup = createComponentCleanup(rendered.ctx);

  queueMicrotask(() => {
    if (!cleanup.active()) {
      return;
    }

    runMountedHooks(rendered.ctx);
  });

  attachComponentCleanup(rendered.node, cleanup.dispose);

  return normalizeRenderedComponentNode(rendered.node);
}

function renderIRPortal(node: IRPortalNode, ctx: any, isSvg: boolean): Node {
  emitRendererDebug("ir:render:portal", () => ({
    hasTarget: node.target != null
  }));

  return WebPortal({
    to: resolvePortalTarget(node.target, ctx),
    children: node.children.map((child) => renderIRNode(child, ctx, isSvg))
  });
}

function renderIRSlot(node: IRSlotNode, ctx: any, isSvg: boolean): Node {
  emitRendererDebug("ir:render:slot", () => ({ name: node.name ?? "default" }));

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
  for (const prop of props) {
    switch (prop.kind) {
      case "static":
        applyStaticProp(el, prop);
        break;
      case "bind":
        applyBindProp(el, prop, ctx);
        break;
      case "event":
        applyEventProp(el, prop, ctx);
        break;
      default:
        emitRendererDebug("ir:render:prop:skip", () => prop);
    }
  }
}

function applyStaticProp(el: Element, prop: IRPropNode): void {
  if (prop.name === "class") {
    if (el instanceof HTMLElement) {
      el.className = String(prop.value ?? "");
      return;
    }
  } else if (prop.name === "style" && typeof prop.value === "object") {
    const styleObj = prop.value as Record<string, any>;
    const styleTarget = (el as HTMLElement | SVGElement).style;
    for (const key in styleObj) {
      styleTarget[key as any] = String(styleObj[key]);
    }
    return;
  }

  if (prop.value != null) {
    el.setAttribute(prop.name, String(prop.value));
  }
}

function applyBindProp(el: Element, prop: IRPropNode, ctx: any): void {
  if (prop.binding?.kind === "simple-path") {
    applyHintedBindProp(el, prop, ctx, prop.binding);
    return;
  }

  const expr = String(prop.value);

  if (prop.name === "class") {
    bindClass(el, () => resolveExpr(ctx, expr));
    return;
  }

  if (prop.name === "style") {
    bindStyle(el, () => {
      const value = resolveExpr(ctx, expr);
      if (typeof value === "string") {
        return { color: value };
      }

      return value || {};
    });
    return;
  }

  bindProp(el, prop.name, () => resolveExpr(ctx, expr));
}

function applyHintedBindProp(el: Element, prop: IRPropNode, ctx: any, binding: IRBindingHint): void {
  if (prop.name === "class") {
    bindClass(el, () => resolveHintedPath(ctx, binding, true));
    return;
  }

  if (prop.name === "style") {
    bindStyle(el, () => {
      const value = resolveHintedPath(ctx, binding, true);
      if (typeof value === "string") {
        return { color: value };
      }

      return value || {};
    });
    return;
  }

  const directSource = resolveHintedDirectSource(ctx, binding);
  if (isDirectBindingSource(directSource)) {
    bindDirectPropSource(el, prop.name, directSource);
    return;
  }

  bindProp(el, prop.name, () => resolveHintedPath(ctx, binding, true));
}

function applyEventProp(el: Element, prop: IRPropNode, ctx: any): void {
  const handler = resolveEventHandler(ctx, String(prop.value));

  if (typeof handler === "function") {
    bindEvent(el, prop.name, handler);
    return;
  }

  emitRendererDebug("error:renderer", () => ({
    message: `Event handler '${prop.value}' is not a function`,
    value: handler,
  }));
}

/* -------------------------------------------------------------------------- */
/*                                    IF                                      */
/* -------------------------------------------------------------------------- */

function renderIRIf(node: IRIfNode, ctx: any, isSvg: boolean): Node {
  emitRendererDebug("ir:render:if", () => ({ condition: node.condition }));

  const anchor = document.createComment("if");
  const parent = createFragment();
  parent.appendChild(anchor);

  const effectFn = effect(() => {
    const condition = !!resolveExpr(ctx, node.condition);
    const branch = condition ? node.then : node.else ?? [];

    let next = anchor.nextSibling;
    while (next) {
      const toRemove = next;
      next = next.nextSibling;
      remove(toRemove);
    }

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
/*                               COMPONENTS                                   */
/* -------------------------------------------------------------------------- */

function resolveComponentBinding(ctx: any, tag: string): FrameworkComponent | null {
  if (!isComponentTag(tag)) {
    return null;
  }

  const registry = ctx?.__components;

  if (!registry || typeof registry !== "object") {
    return null;
  }

  const resolved = registry[tag];
  return typeof resolved === "function" ? resolved as FrameworkComponent : null;
}

function isComponentTag(tag: string): boolean {
  if (typeof tag !== "string" || tag.length === 0) {
    return false;
  }

  const first = tag[0];
  return first >= "A" && first <= "Z";
}

function buildComponentProps(node: IRElementNode, ctx: any, isSvg: boolean): Record<string, any> {
  const props: Record<string, any> = {};

  for (const prop of node.props) {
    if (prop.kind === "static") {
      props[prop.name] = prop.value;
      continue;
    }

    if (prop.kind === "bind") {
      props[prop.name] = prop.binding?.kind === "simple-path"
        ? resolveHintedPath(ctx, prop.binding, true)
        : resolveExpr(ctx, String(prop.value));
      continue;
    }

    if (prop.kind === "event") {
      const handler = resolveEventHandler(ctx, String(prop.value));
      if (typeof handler === "function") {
        props["on" + capitalize(prop.name)] = handler;
      }
    }
  }

  if (node.children.length > 0) {
    props.children = () => {
      const frag = createFragment();

      for (const child of node.children) {
        const dom = renderIRNode(child, ctx, isSvg);
        if (dom) {
          insert(frag, dom);
        }
      }

      return frag;
    };
  }

  return props;
}

function runMountedHooks(ctx: any): void {
  if (!ctx?.mounted) {
    return;
  }

  for (const fn of ctx.mounted) {
    try {
      fn();
    } catch (error) {
      emitRendererDebug("error:component", () => ({
        name: ctx.name,
        instance: ctx.instance,
        error,
      }));
    }
  }
}

function createComponentCleanup(ctx: any): { active: () => boolean; dispose: () => void } {
  let disposed = false;

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;

    if (ctx?.unmounted) {
      for (const fn of ctx.unmounted) {
        try {
          fn();
        } catch (error) {
          emitRendererDebug("error:component", () => ({
            name: ctx.name,
            instance: ctx.instance,
            error,
          }));
        }
      }
    }

    if (ctx?.disposers) {
      for (const cleanup of ctx.disposers) {
        try {
          cleanup();
        } catch {
          // user cleanup errors are non-fatal during teardown
        }
      }

      ctx.disposers.length = 0;
    }
  };

  return {
    active: () => !disposed,
    dispose,
  };
}

function attachComponentCleanup(node: Node, cleanup: () => void): void {
  if (node instanceof DocumentFragment) {
    const children = Array.from(node.childNodes);

    for (const child of children) {
      addNodeCleanup(child, cleanup);
    }

    return;
  }

  addNodeCleanup(node, cleanup);
}

function normalizeRenderedComponentNode(node: Node): Node {
  if (node instanceof DocumentFragment && node.childNodes.length === 1) {
    return node.firstChild as Node;
  }

  return node;
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
