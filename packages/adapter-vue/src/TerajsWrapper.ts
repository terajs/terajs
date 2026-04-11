import { mount, unmount } from "@terajs/renderer-web";
import { signal } from "@terajs/reactivity";

/**
 * Binding contract used by the Vue directive and mount helper.
 */
export interface TerajsVueBinding {
  /** Terajs component module default export or component function. */
  component: any;
  /** Optional initial and reactive props forwarded into Terajs signals. */
  props?: Record<string, unknown>;
}

interface TerajsInstance {
  component: any;
  propsSignals: Record<string, unknown>;
}

const instanceMap = new WeakMap<HTMLElement, TerajsInstance>();

function createSignalProps(props: Record<string, unknown> = {}) {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    result[key] = signal(props[key]);
  }
  return result;
}

function updateSignalProps(target: Record<string, unknown>, nextProps: Record<string, unknown> = {}) {
  for (const key of Object.keys(nextProps)) {
    if (key in target) {
      const existing = target[key] as any;
      if (typeof existing === "function" && "set" in existing) {
        existing.set(nextProps[key]);
        continue;
      }
    }
    target[key] = signal(nextProps[key]);
  }
}

export function mountTerajs(el: HTMLElement, component: any, props?: Record<string, unknown>) {
  const propsSignals = createSignalProps(props);
  mount(component, el, propsSignals);
  instanceMap.set(el, { component, propsSignals });
  return () => {
    unmount(el);
    instanceMap.delete(el);
  };
}

export const TerajsDirective = {
  mounted(el: HTMLElement, binding: { value: TerajsVueBinding }) {
    const { component, props } = binding.value || {};
    if (component) {
      const propsSignals = createSignalProps(props);
      mount(component, el, propsSignals);
      instanceMap.set(el, { component, propsSignals });
    }
  },
  updated(el: HTMLElement, binding: { value: TerajsVueBinding; oldValue: TerajsVueBinding }) {
    const { component, props } = binding.value || {};
    const prevInstance = instanceMap.get(el);

    if (!prevInstance || component !== prevInstance.component) {
      if (prevInstance) {
        unmount(el);
      }
      if (component) {
        const propsSignals = createSignalProps(props);
        mount(component, el, propsSignals);
        instanceMap.set(el, { component, propsSignals });
      }
      return;
    }

    updateSignalProps(prevInstance.propsSignals, props);
  },
  beforeUnmount(el: HTMLElement) {
    const instance = instanceMap.get(el);
    if (instance) {
      unmount(el);
      instanceMap.delete(el);
    }
  }
};
