import type { IRBindingHint, IRPropNode } from "@terajs/compiler";
import type { RendererEventHandler } from "@terajs/renderer";

import { emitRendererDebug } from "./debug.js";
import {
  isDirectBindingSource,
  resolveEventHandler,
  resolveExpr,
  resolveHintedDirectSource,
  resolveHintedPath,
} from "./renderFromIRExpressions.js";

export interface HostIRPropRuntime<ElementLike> {
  applyStaticProp(el: ElementLike, prop: IRPropNode): void;
  bindDirectPropSource(el: ElementLike, name: string, source: unknown): void;
  bindProp(el: ElementLike, name: string, compute: () => any): void;
  bindClass(el: ElementLike, compute: () => any): void;
  bindStyle(el: ElementLike, compute: () => Record<string, any>): void;
  bindEvent(el: ElementLike, name: string, handler: RendererEventHandler): void;
}

export interface HostIRSlotRuntime<
  NodeLike,
  TextLike extends NodeLike = NodeLike,
  FragmentLike extends NodeLike = NodeLike,
> {
  createFragment(): FragmentLike;
  createText(value: string): TextLike;
  insert(parent: NodeLike, child: NodeLike): void;
  isNode(value: unknown): value is NodeLike;
}

export function applyIRProps<ElementLike>(
  el: ElementLike,
  props: IRPropNode[],
  ctx: any,
  runtime: HostIRPropRuntime<ElementLike>
): void {
  for (const prop of props) {
    switch (prop.kind) {
      case "static":
        runtime.applyStaticProp(el, prop);
        break;
      case "bind":
        applyBindProp(el, prop, ctx, runtime);
        break;
      case "event":
        applyEventProp(el, prop, ctx, runtime);
        break;
      default:
        emitRendererDebug("ir:render:prop:skip", () => prop);
    }
  }
}

export function normalizeSlotValue<
  NodeLike,
  TextLike extends NodeLike = NodeLike,
  FragmentLike extends NodeLike = NodeLike,
>(
  value: any,
  runtime: HostIRSlotRuntime<NodeLike, TextLike, FragmentLike>
): NodeLike {
  if (typeof value === "function") {
    return normalizeSlotValue(value(), runtime);
  }

  if (value == null || value === false || value === true) {
    return runtime.createFragment() as NodeLike;
  }

  if (runtime.isNode(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const frag = runtime.createFragment();
    for (const item of value) {
      runtime.insert(frag as NodeLike, normalizeSlotValue(item, runtime));
    }
    return frag as NodeLike;
  }

  return runtime.createText(String(value)) as NodeLike;
}

function applyBindProp<ElementLike>(
  el: ElementLike,
  prop: IRPropNode,
  ctx: any,
  runtime: HostIRPropRuntime<ElementLike>
): void {
  if (prop.binding?.kind === "simple-path") {
    applyHintedBindProp(el, prop, ctx, prop.binding, runtime);
    return;
  }

  const expr = String(prop.value);

  if (prop.name === "class") {
    runtime.bindClass(el, () => resolveExpr(ctx, expr));
    return;
  }

  if (prop.name === "style") {
    runtime.bindStyle(el, () => {
      const value = resolveExpr(ctx, expr);
      if (typeof value === "string") {
        return { color: value };
      }

      return value || {};
    });
    return;
  }

  runtime.bindProp(el, prop.name, () => resolveExpr(ctx, expr));
}

function applyHintedBindProp<ElementLike>(
  el: ElementLike,
  prop: IRPropNode,
  ctx: any,
  binding: IRBindingHint,
  runtime: HostIRPropRuntime<ElementLike>
): void {
  if (prop.name === "class") {
    runtime.bindClass(el, () => resolveHintedPath(ctx, binding, true));
    return;
  }

  if (prop.name === "style") {
    runtime.bindStyle(el, () => {
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
    runtime.bindDirectPropSource(el, prop.name, directSource);
    return;
  }

  runtime.bindProp(el, prop.name, () => resolveHintedPath(ctx, binding, true));
}

function applyEventProp<ElementLike>(
  el: ElementLike,
  prop: IRPropNode,
  ctx: any,
  runtime: HostIRPropRuntime<ElementLike>
): void {
  const handler = resolveEventHandler(ctx, String(prop.value));

  if (typeof handler === "function") {
    runtime.bindEvent(el, prop.name, handler);
    return;
  }

  emitRendererDebug("error:renderer", () => ({
    message: `Event handler '${prop.value}' is not a function`,
    value: handler,
  }));
}