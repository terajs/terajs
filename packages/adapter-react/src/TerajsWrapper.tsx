import { useEffect, useRef } from "react";
import { mount, unmount } from "@terajs/renderer-web";
import { signal } from "@terajs/reactivity";

/**
 * Props for mounting a Terajs component inside a React tree.
 */
export interface TerajsWrapperProps {
  /** Terajs component module default export or component function. */
  component: any;
  /** Optional initial and reactive props forwarded into Terajs signals. */
  props?: Record<string, unknown>;
}

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

export function TerajsWrapper({ component, props }: TerajsWrapperProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const currentComponentRef = useRef<any>(component);
  const propsRef = useRef<Record<string, unknown>>(createSignalProps(props));
  const mountedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (!mountedRef.current || component !== currentComponentRef.current) {
      if (mountedRef.current) {
        unmount(root);
      }
      propsRef.current = createSignalProps(props);
      mount(component, root, propsRef.current);
      currentComponentRef.current = component;
      mountedRef.current = true;
    }

    return () => {
      if (mountedRef.current) {
        unmount(root);
        mountedRef.current = false;
      }
    };
  }, [component]);

  useEffect(() => {
    if (component === currentComponentRef.current) {
      updateSignalProps(propsRef.current, props);
    }
  }, [component, props]);

  return <div ref={rootRef} />;
}
