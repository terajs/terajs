import type {
  IRBindingHint,
  IRElementNode,
  IRIfNode,
  IRInterpolationNode,
  IRModule,
  IRNode,
  IRPropNode,
  IRSlotNode,
  IRTextNode,
} from "@terajs/compiler";
import type { RendererHost } from "@terajs/renderer";

import { dispose, effect } from "@terajs/reactivity";

import { emitRendererDebug } from "./debug.js";
import { createIRForRenderer } from "./hostIRForRenderer.js";
import type { HostBindings } from "./hostBindings.js";
import {
  isDirectBindingSource,
  resolveDirectTextSource,
  resolveEventHandler,
  resolveExpr,
  resolveHintedDirectSource,
  resolveHintedPath,
} from "./renderFromIRExpressions.js";

export interface HostIRRendererRuntime<
  NodeLike,
  ElementLike extends NodeLike = NodeLike,
  TextLike extends NodeLike = NodeLike,
  FragmentLike extends NodeLike = NodeLike,
> {
  host: RendererHost<NodeLike, ElementLike, TextLike, FragmentLike>;
  bindings: HostBindings<ElementLike, TextLike>;
}

export function createHostIRRenderer<
  NodeLike,
  ElementLike extends NodeLike = NodeLike,
  TextLike extends NodeLike = NodeLike,
  FragmentLike extends NodeLike = NodeLike,
>(runtime: HostIRRendererRuntime<NodeLike, ElementLike, TextLike, FragmentLike>) {
  const {
    addNodeCleanup,
    createAnchor,
    createElement,
    createFragment,
    createText,
    getNextSibling,
    getParent,
    insert,
    isNode,
    remove,
    setClass,
    setProp,
    setStyle,
  } = runtime.host;
  const {
    bindText,
    bindDirectTextSource,
    bindDirectPropSource,
    bindProp,
    bindClass,
    bindStyle,
    bindEvent,
  } = runtime.bindings;
  const renderIRForNode = createIRForRenderer<NodeLike, FragmentLike>(runtime.host);

  function renderIRModule(ir: IRModule, ctx: any): FragmentLike {
    emitRendererDebug("ir:render:module", () => ({ filePath: ir.filePath }));

    const frag = createFragment();

    for (const node of ir.template) {
      const dom = renderIRNode(node, ctx);
      if (dom) {
        insert(frag as NodeLike, dom);
      }
    }

    return frag;
  }

  function renderIRNode(node: IRNode, ctx: any, isSvg: boolean = false): NodeLike | null {
    switch (node.type) {
      case "text":
        return renderIRText(node);
      case "interp":
        return renderIRInterpolation(node, ctx);
      case "element":
        return renderIRElement(node, ctx, isSvg);
      case "slot":
        return renderIRSlot(node, ctx, isSvg);
      case "if":
        return renderIRIf(node, ctx, isSvg);
      case "for":
        return renderIRForNode(node, ctx, isSvg, renderIRNode);
      case "portal":
        emitRendererDebug("error:renderer", () => ({
          message: `${node.type} is not supported by the host-simulation renderer yet`,
          node
        }));
        return null;
      default:
        emitRendererDebug("error:renderer", () => ({ message: "Unknown IR node", node }));
        return null;
    }
  }

  function renderIRText(node: IRTextNode): TextLike {
    emitRendererDebug("ir:render:text", () => ({ value: node.value }));
    return createText(node.value);
  }

  function renderIRInterpolation(node: IRInterpolationNode, ctx: any): TextLike {
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

  function renderIRElement(node: IRElementNode, ctx: any, isSvg: boolean): ElementLike | null {
    if (isComponentTag(node.tag)) {
      emitRendererDebug("error:renderer", () => ({
        message: `Component tags are not supported by the host-simulation renderer yet: ${node.tag}`,
        node
      }));
      return null;
    }

    emitRendererDebug("ir:render:element", () => ({ tag: node.tag, svg: isSvg }));

    const nextSvg = isSvg || node.tag === "svg";
    const el = createElement(node.tag, nextSvg);

    applyIRProps(el, node.props, ctx);

    for (const child of node.children) {
      const dom = renderIRNode(child, ctx, nextSvg);
      if (dom) {
        insert(el as NodeLike, dom);
      }
    }

    return el;
  }

  function renderIRSlot(node: IRSlotNode, ctx: any, isSvg: boolean): NodeLike {
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
        insert(frag as NodeLike, dom);
      }
    }

    return frag;
  }

  function renderIRIf(node: IRIfNode, ctx: any, isSvg: boolean): NodeLike {
    emitRendererDebug("ir:render:if", () => ({ condition: node.condition }));

    const anchor = createAnchor("if");
    const fragment = createFragment();
    insert(fragment as NodeLike, anchor);

    const ownedNodes: NodeLike[] = [];

    const effectFn = effect(() => {
      const condition = !!resolveExpr(ctx, node.condition);
      const branch = condition ? node.then : node.else ?? [];

      const container = getParent(anchor as NodeLike);
      if (!container) {
        return;
      }

      for (const ownedNode of ownedNodes) {
        remove(ownedNode);
      }
      ownedNodes.length = 0;

      let ref = getNextSibling(anchor as NodeLike);
      for (const child of branch) {
        const dom = renderIRNode(child, ctx, isSvg);
        if (dom && isNode(dom)) {
          insert(container, dom, ref ?? null);
          ownedNodes.push(dom);
          ref = null;
        }
      }
    });

    addNodeCleanup(anchor as NodeLike, () => {
      dispose(effectFn);
      for (const ownedNode of ownedNodes) {
        remove(ownedNode);
      }
      ownedNodes.length = 0;
    });

    return fragment;
  }

  function applyIRProps(el: ElementLike, props: IRPropNode[], ctx: any): void {
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

  function applyStaticProp(el: ElementLike, prop: IRPropNode): void {
    if (prop.name === "class") {
      setClass(el, String(prop.value ?? ""));
      return;
    }

    if (prop.name === "style" && typeof prop.value === "object") {
      const resolved: Record<string, string> = {};
      const styleObj = prop.value as Record<string, any>;
      for (const key in styleObj) {
        resolved[key] = String(styleObj[key]);
      }
      setStyle(el, resolved);
      return;
    }

    if (prop.value != null) {
      setProp(el, prop.name, prop.value);
    }
  }

  function applyBindProp(el: ElementLike, prop: IRPropNode, ctx: any): void {
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

  function applyHintedBindProp(el: ElementLike, prop: IRPropNode, ctx: any, binding: IRBindingHint): void {
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

  function applyEventProp(el: ElementLike, prop: IRPropNode, ctx: any): void {
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

  function normalizeSlotValue(value: any): NodeLike {
    if (typeof value === "function") {
      return normalizeSlotValue(value());
    }

    if (value == null || value === false || value === true) {
      return createFragment() as NodeLike;
    }

    if (isNode(value)) {
      return value;
    }

    if (Array.isArray(value)) {
      const frag = createFragment();
      for (const item of value) {
        insert(frag as NodeLike, normalizeSlotValue(item));
      }
      return frag as NodeLike;
    }

    return createText(String(value)) as NodeLike;
  }

  return {
    renderIRModule,
    renderIRNode,
  };
}

function isComponentTag(tag: string): boolean {
  if (typeof tag !== "string" || tag.length === 0) {
    return false;
  }

  const first = tag[0];
  return first >= "A" && first <= "Z";
}
