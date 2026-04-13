import { getReactiveByRid, setReactiveValue } from "@terajs/shared";
import {
  coerceEditableInputValue,
  isRefLike,
  isSignalLike,
  type PrimitiveEditableValue,
  unwrapInspectableValue
} from "./editableValues.js";

type InspectableComponentContext = {
  props?: unknown;
  meta?: unknown;
  ai?: unknown;
  route?: unknown;
};

export interface LiveComponentSnapshots {
  props?: unknown;
  meta?: unknown;
  ai?: unknown;
  route?: unknown;
}

export function resolveLivePropsSnapshot(scope: string, instance: number, fallback: unknown): unknown {
  return resolveLiveComponentContext(scope, instance)?.props ?? fallback;
}

export function resolveLiveComponentSnapshots(scope: string, instance: number): LiveComponentSnapshots | null {
  return resolveLiveComponentContext(scope, instance);
}

export function toggleLivePropValue(scope: string, instance: number, key: string): boolean {
  const context = resolveLiveComponentContext(scope, instance);
  if (!context?.props || typeof context.props !== "object") {
    return false;
  }

  const props = context.props as Record<string, unknown>;
  const resolved = unwrapInspectableValue(props[key]);
  if (typeof resolved !== "boolean") {
    return false;
  }

  return applyLivePropValue(props, key, !resolved);
}

export function applyLivePropInput(scope: string, instance: number, key: string, rawValue: string): boolean {
  const context = resolveLiveComponentContext(scope, instance);
  if (!context?.props || typeof context.props !== "object") {
    return false;
  }

  const props = context.props as Record<string, unknown>;
  const currentValue = unwrapInspectableValue(props[key]);
  const coerced = coerceEditableInputValue(rawValue, currentValue);
  if (coerced === undefined) {
    return false;
  }

  return applyLivePropValue(props, key, coerced);
}

export function toggleLiveReactiveValue(rid: string): boolean {
  const currentValue = getReactiveByRid(rid)?.currentValue;
  if (typeof currentValue !== "boolean") {
    return false;
  }

  return setReactiveValue(rid, !currentValue);
}

export function applyLiveReactiveInput(rid: string, rawValue: string): boolean {
  const currentValue = getReactiveByRid(rid)?.currentValue;
  const coerced = coerceEditableInputValue(rawValue, currentValue);
  if (coerced === undefined) {
    return false;
  }

  return setReactiveValue(rid, coerced);
}

function resolveLiveComponentContext(scope: string, instance: number): InspectableComponentContext | null {
  if (typeof document === "undefined") {
    return null;
  }

  const selector = `[data-terajs-component-scope="${escapeAttributeSelector(scope)}"][data-terajs-component-instance="${instance}"]`;
  const element = document.querySelector(selector) as (HTMLElement & { __terajsComponentContext?: InspectableComponentContext }) | null;
  const context = element?.__terajsComponentContext;

  if (!context || typeof context !== "object") {
    return null;
  }

  return context;
}

function applyLivePropValue(props: Record<string, unknown>, key: string, nextValue: PrimitiveEditableValue): boolean {
  const currentValue = props[key];

  if (isRefLike(currentValue)) {
    currentValue.value = nextValue;
    return true;
  }

  if (isSignalLike(currentValue)) {
    currentValue.set(nextValue);
    return true;
  }

  props[key] = nextValue;
  return true;
}

function escapeAttributeSelector(value: string): string {
  const css = globalThis.CSS;
  if (css && typeof css.escape === "function") {
    return css.escape(value);
  }

  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
