/**
 * @file component.ts
 * @description
 * High-level component wrapper for Nebula.
 * Now includes optional HMR integration (dev-only).
 */

import { emitDebug as emit, Debug } from "@nebula/shared";
import { getCurrentEffect } from "@nebula/reactivity";
import {
  pushContextFrame,
  popContextFrame,
  contextStack
} from "../context/contextStack";
import {
  type Disposer,
  type ComponentContext,
  getCurrentContext,
  setCurrentContext
} from "./context";

import type { HMRInstance } from "../hmr";
import { registerHMRComponent } from "../hmr";

/** Global instance counter per component name */
const instanceCounters = new Map<string, number>();

/**
 * Register a cleanup function to run when the component unmounts.
 */
export function onCleanup(fn: Disposer): void {
  const effect = getCurrentEffect();
  const context = getCurrentContext();

  if (effect) {
    effect.cleanups.push(fn);
    return;
  }

  if (context) {
    context.disposers.push(fn);
    return;
  }

  Debug.emit("lifecycle:warn", { message: "onCleanup called without context" });
}

/**
 * Create a Nebula component wrapper.
 *
 * This is the primary runtime entry point for components.
 * It wires the setup function into Nebula's context system and,
 * in development, registers the component for HMR.
 */
export function component<P = any>(
  options: { name?: string; meta?: any },
  setup: (props: P) => Node | (() => Node)
) {
  const name = options.name ?? "AnonymousComponent";

  // HMR state (dev-only; tree-shaken in prod)
  let currentSetup = setup;
  let currentIR: any = null;
  const instances = new Set<HMRInstance>();

  // Register with HMR system
  registerHMRComponent({
    name,
    getSetup: () => currentSetup,
    getIR: () => currentIR,
    setSetup: (fn) => { currentSetup = fn; },
    setIR: (ir) => { currentIR = ir; },
    instances
  });

  function ComponentWrapper(props?: P) {
    const instance = (instanceCounters.get(name) ?? 0) + 1;
    instanceCounters.set(name, instance);

    emit({
      type: "component:mounted",
      scope: name,
      instance,
      timestamp: Date.now()
    });

    pushContextFrame();

    const ctx: ComponentContext = {
      disposers: [],
      props,
      frame: contextStack[contextStack.length - 1],
      name,
      instance
    };

    setCurrentContext(ctx);

    let out: any;
    try {
      out = currentSetup(props as P);
    } catch (err) {
      console.error(`[Nebula] Error in component <${name} />:`, err);
      setCurrentContext(null);
      popContextFrame();
      throw err;
    }

    setCurrentContext(null);
    popContextFrame();

    // HMR instance wrapper
    const hmrInstance: HMRInstance = {
      ctx,
      remount: () => {
        pushContextFrame();
        setCurrentContext(ctx);
        currentSetup(ctx.props);
        setCurrentContext(null);
        popContextFrame();
      },
      dispose: () => {
        for (const d of ctx.disposers) d();
        ctx.disposers.length = 0;
      },
      updateIR: (ir) => {
        currentIR = ir;
      }
    };

    instances.add(hmrInstance);

    return out;
  }
  // Attach meta/ai/route to the wrapper for runtime/devtools access (agnostic, not web-specific)
  Object.defineProperty(ComponentWrapper, "meta", { value: options.meta, enumerable: false });
  Object.defineProperty(ComponentWrapper, "ai", { value: options.ai, enumerable: false });
  Object.defineProperty(ComponentWrapper, "route", { value: options.route, enumerable: false });
  return ComponentWrapper;
}
