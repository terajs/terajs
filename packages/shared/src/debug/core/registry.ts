import type { ComponentInstanceInfo, ReactiveInstanceInfo } from "../types/registry.js";
import type { ReactiveMetadata } from "../types/metadata.js";

/**
 * Debug registry for tracking composable instances and reactive primitives.
 */
let currentComposable: string | null = null;

export function setCurrentComposable(name: string) {
  currentComposable = name;
}

export function clearCurrentComposable() {
  currentComposable = null;
}

export function getCurrentComposable() {
  return currentComposable;
}


/**
 * In-memory registry of all active component instances.
 * Keyed by "scope#instance", e.g. "Counter#1".
 */
const components = new Map<string, ComponentInstanceInfo>();

/**
 * In-memory registry of all reactive instances.
 * Keyed by RID.
 */
const reactives = new Map<string, ReactiveInstanceInfo>();

function componentKey(scope: string, instance: number): string {
  return `${scope}#${instance}`;
}

/**
 * Registers a new component instance.
 */
export function registerComponentInstance(options: {
  scope: string;
  instance: number;
  route?: string;
}): ComponentInstanceInfo {
  const key = componentKey(options.scope, options.instance);
  const info: ComponentInstanceInfo = {
    scope: options.scope,
    instance: options.instance,
    route: options.route,
    reactives: new Set(),
    domNodes: new Set()
  };
  components.set(key, info);
  return info;
}

/**
 * Unregisters a component instance and detaches its reactives.
 */
export function unregisterComponentInstance(scope: string, instance: number): void {
  const key = componentKey(scope, instance);
  const info = components.get(key);
  if (!info) return;

  // Optionally: clean up ownership references on reactives.
  for (const rid of info.reactives) {
    const reactive = reactives.get(rid);
    if (reactive && reactive.owner?.scope === scope && reactive.owner.instance === instance) {
      reactive.owner = undefined;
    }
  }

  components.delete(key);
}

/**
 * Registers a reactive instance and optionally associates it with a component.
 */
export function registerReactiveInstance(meta: ReactiveMetadata, owner?: {
  scope: string;
  instance: number;
}, controls?: {
  setValue?: (value: unknown) => void;
}): ReactiveInstanceInfo {
  const info: ReactiveInstanceInfo = {
    meta,
    currentValue: undefined,
    owner,
    setValue: controls?.setValue
  };

  reactives.set(meta.rid, info);

  if (owner) {
    const key = componentKey(owner.scope, owner.instance);
    const component = components.get(key);
    if (component) {
      component.reactives.add(meta.rid);
    }
  }

  return info;
}

/**
 * Updates the current value of a reactive instance, if tracked.
 */
export function updateReactiveValue(rid: string, value: unknown): void {
  const info = reactives.get(rid);
  if (!info) return;
  info.currentValue = value;
}

/**
 * Associates a DOM node id with a component instance.
 */
export function registerDomNodeForComponent(scope: string, instance: number, nodeId: string): void {
  const key = componentKey(scope, instance);
  const component = components.get(key);
  if (!component) return;
  component.domNodes.add(nodeId);
}

/**
 * Returns a snapshot of all registered components.
 */
export function getAllComponents(): ComponentInstanceInfo[] {
  return Array.from(components.values());
}

/**
 * Returns a snapshot of all registered reactives.
 */
export function getAllReactives(): ReactiveInstanceInfo[] {
  return Array.from(reactives.values());
}

/**
 * Looks up a reactive instance by RID.
 */
export function getReactiveByRid(rid: string): ReactiveInstanceInfo | undefined {
  return reactives.get(rid);
}

/**
 * Applies a live mutation to a registered reactive when the runtime exposes one.
 *
 * Returns false when the reactive is unknown or read-only.
 */
export function setReactiveValue(rid: string, value: unknown): boolean {
  const reactive = reactives.get(rid);
  if (!reactive?.setValue) {
    return false;
  }

  reactive.setValue(value);
  return true;
}

/**
 * Looks up a component instance by scope + instance.
 */
export function getComponentInstance(scope: string, instance: number): ComponentInstanceInfo | undefined {
  return components.get(componentKey(scope, instance));
}

export function resetDebugRegistry(): void {
  components.clear();
  reactives.clear();
}
