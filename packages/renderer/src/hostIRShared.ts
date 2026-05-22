import type { RendererEventHandler } from "@terajs/renderer";

import { emitRendererDebug } from "./debug.js";
import type { HostIRBindingHint, HostIRPropNode } from "./hostIRTypes.js";
import {
  isDirectBindingSource,
  resolveEventHandler,
  resolveExpr,
  resolveHintedDirectSource,
  resolveHintedPath,
} from "./renderFromIRExpressions.js";

export interface HostIRPropRuntime<ElementLike> {
  applyStaticProp(el: ElementLike, prop: HostIRPropNode): void;
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
  props: HostIRPropNode[],
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
    const fragment = runtime.createFragment();
    for (const item of value) {
      runtime.insert(fragment as NodeLike, normalizeSlotValue(item, runtime));
    }
    return fragment as NodeLike;
  }

  return runtime.createText(String(value)) as NodeLike;
}

function applyBindProp<ElementLike>(
  el: ElementLike,
  prop: HostIRPropNode,
  ctx: any,
  runtime: HostIRPropRuntime<ElementLike>
): void {
  if (prop.binding?.kind === "simple-path") {
    applyHintedBindProp(el, prop, ctx, prop.binding, runtime);
    return;
  }

  const expression = String(prop.value);

  if (prop.name === "class") {
    runtime.bindClass(el, () => resolveExpr(ctx, expression));
    return;
  }

  if (prop.name === "style") {
    runtime.bindStyle(el, () => {
      const value = resolveExpr(ctx, expression);
      if (typeof value === "string") {
        return { color: value };
      }

      return value || {};
    });
    return;
  }

  runtime.bindProp(el, prop.name, () => resolveExpr(ctx, expression));
}

function applyHintedBindProp<ElementLike>(
  el: ElementLike,
  prop: HostIRPropNode,
  ctx: any,
  binding: HostIRBindingHint,
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
  prop: HostIRPropNode,
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