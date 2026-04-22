/**
 * @file mount.ts
 * @description
 * Mounting and unmounting entry points for Terajs's component system.
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

import { insert, clear } from "./dom.js";
import { renderComponent, type FrameworkComponent } from "./render.js";
import type { ComponentContext } from "@terajs/runtime";
import { emitRendererDebug } from "./debug.js";

declare global {
  interface HTMLElement {
    /** Internal: component context for the mounted component. */
    __ctx?: ComponentContext;
  }
}

export interface MountOptions {
  /**
   * Optional mount target element or selector.
   *
   * - HTMLElement: mount directly into the element.
   * - selector: querySelector lookup (`#app`, `.shell`, `[data-root]`).
   * - omitted: defaults to `#app`.
   */
  target?: HTMLElement | string;

  /** Optional component props. */
  props?: any;

  /**
   * When true, mount creates a missing default/id-selector root automatically.
   * Defaults to true.
   */
  createIfMissing?: boolean;

  /**
   * Default root id used when target is omitted.
   * Defaults to "app".
   */
  defaultId?: string;

  /**
   * Host element for auto-created mount roots.
   * Defaults to document.body when available.
   */
  appendTo?: HTMLElement;

  /**
   * Tag used when auto-creating a mount root.
   * Defaults to "div".
   */
  rootTag?: string;
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function isMountOptions(value: unknown): value is MountOptions {
  return !!value && typeof value === "object" && !isHTMLElement(value);
}

function resolveParent(appendTo?: HTMLElement): HTMLElement {
  if (appendTo) {
    return appendTo;
  }

  if (typeof document === "undefined") {
    throw new Error("mount() requires an explicit HTMLElement target outside browser environments.");
  }

  return document.body ?? document.documentElement;
}

function createRoot(id: string, rootTag: string, appendTo?: HTMLElement): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error("mount() cannot auto-create a root outside browser environments.");
  }

  const root = document.createElement(rootTag);
  root.id = id;
  resolveParent(appendTo).appendChild(root);
  return root;
}

function resolveRoot(
  target: HTMLElement | string | undefined,
  options: Required<Pick<MountOptions, "createIfMissing" | "defaultId" | "rootTag">> & Pick<MountOptions, "appendTo">
): HTMLElement {
  const { createIfMissing, defaultId, appendTo, rootTag } = options;

  if (isHTMLElement(target)) {
    return target;
  }

  if (typeof document === "undefined") {
    throw new Error("mount() requires an explicit HTMLElement target outside browser environments.");
  }

  if (typeof target === "string") {
    const found = document.querySelector(target);
    if (isHTMLElement(found)) {
      return found;
    }

    if (!createIfMissing) {
      throw new Error(`mount target '${target}' was not found.`);
    }

    const idMatch = target.match(/^#([A-Za-z][\w:-]*)$/);
    if (!idMatch) {
      throw new Error(`mount target '${target}' was not found. Auto-create only supports id selectors.`);
    }

    return createRoot(idMatch[1], rootTag, appendTo);
  }

  const selector = `#${defaultId}`;
  const existing = document.querySelector(selector);
  if (isHTMLElement(existing)) {
    return existing;
  }

  if (!createIfMissing) {
    throw new Error(`mount target '${selector}' was not found.`);
  }

  return createRoot(defaultId, rootTag, appendTo);
}

/**
 * Mounts a component into a root element.
 *
 * @param component - The component to mount.
 * @param root - The DOM element to mount into.
 * @param props - Optional props passed to the component.
 */
export function mount(component: FrameworkComponent, root: HTMLElement, props?: any): HTMLElement;
export function mount(component: FrameworkComponent, target?: string, props?: any): HTMLElement;
export function mount(component: FrameworkComponent, options?: MountOptions): HTMLElement;
export function mount(
  component: FrameworkComponent,
  targetOrOptions?: HTMLElement | string | MountOptions,
  props?: any
): HTMLElement {
  const options = isMountOptions(targetOrOptions) ? targetOrOptions : undefined;
  const target: HTMLElement | string | undefined = options
    ? options.target
    : isHTMLElement(targetOrOptions)
    ? targetOrOptions
    : typeof targetOrOptions === "string" || typeof targetOrOptions === "undefined"
    ? targetOrOptions
    : undefined;
  const componentProps = options?.props ?? props;

  const root = resolveRoot(target, {
    createIfMissing: options?.createIfMissing ?? true,
    defaultId: options?.defaultId ?? "app",
    appendTo: options?.appendTo,
    rootTag: options?.rootTag ?? "div"
  });

  emitRendererDebug("component:mount", () => ({
    component,
    root,
    props: componentProps
  }));

  if (root.__ctx) {
    unmount(root);
  } else {
    clear(root);
  }

  // Render component
  const { node, ctx } = renderComponent(component, componentProps);

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
        emitRendererDebug("error:component", () => ({
          name: ctx.name,
          instance: ctx.instance,
          error: err
        }));
      }
    }
  }

  return root;
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

  emitRendererDebug("component:unmount", () => ({
    root,
    context: ctx
  }));

  if (ctx) {
    // Run onUnmounted lifecycle hooks
    if (ctx.unmounted) {
      for (const fn of ctx.unmounted) {
        try {
          fn();
        } catch (err) {
          emitRendererDebug("error:component", () => ({
            name: ctx.name,
            instance: ctx.instance,
            error: err
          }));
        }
      }
    }

    // Run cleanup disposers
    for (const dispose of ctx.disposers) {
      try {
        emitRendererDebug("component:dispose", () => ({
          disposer: dispose,
          context: ctx
        }));
        dispose();
      } catch {
        // swallow user cleanup errors
      }
    }

    root.__ctx = undefined;
  }

  // Clear DOM
  clear(root);
}
