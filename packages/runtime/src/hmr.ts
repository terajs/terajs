/**
 * @file hmr.ts
 * @description
 * Hot Module Replacement runtime for Terajs.
 *
 * Tracks live component instances and supports hot-swapping
 * setup functions and IR modules without full reload.
 */

import { Debug } from "@terajs/shared";
import type { ComponentContext } from "./component/context.js";

export interface HMRInstance {
  ctx: ComponentContext;
  remount: () => void;
  dispose: () => void;
  updateIR: (nextIR: any) => void;
}

export interface HMRComponentHandle {
  name: string;
  getSetup: () => (props: any) => any;
  getIR: () => any;
  setSetup: (fn: (props: any) => any) => void;
  setIR: (ir: any) => void;
  instances: Set<HMRInstance>;
}

const registry = new Map<string, HMRComponentHandle>();

/**
 * Register a component for HMR tracking.
 */
export function registerHMRComponent(handle: HMRComponentHandle): void {
  registry.set(handle.name, handle);

  Debug.emit("hmr:register", {
    name: handle.name
  });
}

/**
 * Unregister a component from HMR tracking.
 */
export function unregisterHMRComponent(name: string): void {
  registry.delete(name);

  Debug.emit("hmr:update:component", {
    name,
    action: "unregister"
  });
}

/**
 * Apply a hot update to a component by name.
 *
 * - If `nextSetup` is provided, the component's setup function is replaced.
 * - If `nextIR` is provided, the component's IR is replaced.
 * - All live instances are disposed and remounted with the new code.
 */
export function applyHMRUpdate(
  name: string,
  nextSetup: ((props: any) => any) | null,
  nextIR: any | null
): void {
  const handle = registry.get(name);
  if (!handle) {
    Debug.emit("hmr:update:component", {
      name,
      missing: true
    });
    return;
  }

  Debug.emit("hmr:update:component", {
    name,
    start: true
  });

  const prevSetup = handle.getSetup();
  const prevIR = handle.getIR();

  // Swap setup
  if (nextSetup) {
    handle.setSetup(nextSetup);
    Debug.emit("hmr:update:setup", { name });
  }

  // Swap IR
  if (nextIR !== null) {
    handle.setIR(nextIR);
    Debug.emit("hmr:update:ir", { name });
  }

  // Update all live instances
  for (const instance of handle.instances) {
    Debug.emit("hmr:update:instance", {
      name,
      instance: instance.ctx.instance
    });

    try {
      instance.dispose();
      if (nextIR !== null) instance.updateIR(nextIR);
      instance.remount();
    } catch (err) {
      // Roll back on failure
      handle.setSetup(prevSetup);
      handle.setIR(prevIR);

      Debug.emit("error:component", {
        name,
        error: err,
        during: "hmr"
      });

      throw err;
    }
  }

  Debug.emit("hmr:update:component", {
    name,
    complete: true
  });
}

