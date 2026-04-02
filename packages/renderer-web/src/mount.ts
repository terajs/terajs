/**
 * @file mount.ts
 * @description
 * Mounting and unmounting entry points for Nebula’s component system.
 *
 * Mounting:
 * - Clears the root
 * - Executes the component
 * - Stores its ComponentContext on the root
 * - Inserts the resulting DOM node
 * - Runs onMounted() lifecycle hooks
 *
 * Unmounting:
 * - Runs onUnmounted() lifecycle hooks
 * - Runs all disposers registered via `onCleanup`
 * - Clears the DOM
 */

import { insert } from "./dom";
import { renderComponent, type FrameworkComponent } from "./render";
import type { ComponentContext } from "@nebula/runtime";
import { Debug } from "@nebula/shared";

declare global {
  interface HTMLElement {
    /** Internal: component context for the mounted component. */
    __ctx?: ComponentContext;
  }
}

/**
 * Mounts a component into a root element.
 *
 * @param component - The component to mount.
 * @param root - The DOM element to mount into.
 * @param props - Optional props passed to the component.
 */
export function mount(
  component: FrameworkComponent,
  root: HTMLElement,
  props?: any
): void {
  Debug.emit("component:mount", {
    component,
    root,
    props
  });

  // Clear root
  root.innerHTML = "";

  // Render component
  const { node, ctx } = renderComponent(component, props);

  // Store context on root
  root.__ctx = ctx;

  // Insert DOM
  insert(root, node);

  // Run onMounted lifecycle hooks
  if (ctx.mounted) {
    for (const fn of ctx.mounted) {
      try {
        fn();
      } catch (err) {
        Debug.emit("error:component", {
          name: ctx.name,
          instance: ctx.instance,
          error: err
        });
      }
    }
  }
}

/**
 * Unmounts the component currently mounted in the root element.
 *
 * Runs:
 * - onUnmounted lifecycle hooks
 * - all cleanup functions registered via onCleanup()
 * - clears the DOM
 *
 * @param root - The DOM element to unmount from.
 */
export function unmount(root: HTMLElement): void {
  const ctx = root.__ctx;

  Debug.emit("component:unmount", {
    root,
    context: ctx
  });

  if (ctx) {
    // Run onUnmounted lifecycle hooks
    if (ctx.unmounted) {
      for (const fn of ctx.unmounted) {
        try {
          fn();
        } catch (err) {
          Debug.emit("error:component", {
            name: ctx.name,
            instance: ctx.instance,
            error: err
          });
        }
      }
    }

    // Run cleanup disposers
    for (const dispose of ctx.disposers) {
      try {
        Debug.emit("component:dispose", {
          disposer: dispose,
          context: ctx
        });
        dispose();
      } catch {
        // swallow user cleanup errors
      }
    }

    root.__ctx = undefined;
  }

  // Clear DOM
  root.innerHTML = "";
}