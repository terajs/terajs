/**
 * @file index.ts
 * @description
 * Complete entry point for the @terajs/renderer.
 */

// Core Rendering & Mounting
export * from "./render";
export * from "./mount";
export * from "./template";

// JSX Runtime (Crucial for .tera file compilation)
export * from "./jsx-runtime";

// Control Flow Components
export * from "./controlFlow";
export * from "./for";

// DOM & Reconciliation Utilities
export * from "./dom";
export * from "./bindings";
export * from "./updateKeyedList";
export * from "./styles";

// Internal Helpers
export * from "./unwrap";

// Hydration API
export * from "./hydrate";

// Portal primitive
export * from "./portal";

// Router-aware link primitive
export * from "./link";

// Enhanced form primitive
export * from "./form";

// Error boundaries
export * from "./errorBoundary";

// Router context helpers
export * from "./routerContext";

// Route-shell helpers
export * from "./routeShell";

// IR Renderer (SSR-aligned baseline for client-side rendering)
export * from "./renderFromIR";

// Router bridge
export * from "./routerView";

// Web Component integration
import { mount, unmount } from "./mount";
import { signal, type Signal } from "@terajs/reactivity";
import type { FrameworkComponent } from "./render";

function normalizeAttributeName(name: string): string {
  return name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function parseAttributeValue(value: string | null): unknown {
  if (value === null) return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
}

function createPropsFromAttributes(el: HTMLElement): Record<string, Signal<unknown>> {
  const props: Record<string, Signal<unknown>> = {};
  for (const attr of Array.from(el.attributes)) {
    props[normalizeAttributeName(attr.name)] = signal(parseAttributeValue(attr.value));
  }
  return props;
}

export function defineCustomElement(name: string, component: FrameworkComponent): void {
  class TerajsCustomElement extends HTMLElement {
    private root!: HTMLElement;
    private props: Record<string, Signal<unknown>> = {};
    private observer!: MutationObserver;

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      const mountTarget = document.createElement("div");
      shadow.appendChild(mountTarget);
      this.root = mountTarget;
      this.props = createPropsFromAttributes(this);
      this.observer = new MutationObserver(this.handleAttributeMutations.bind(this));
      this.observer.observe(this, { attributes: true });
    }

    connectedCallback() {
      mount(component, this.root, this.getProps());
    }

    disconnectedCallback() {
      this.observer.disconnect();
      unmount(this.root);
    }

    private getProps(): Record<string, unknown> {
      const result: Record<string, unknown> = {};
      for (const [key, sig] of Object.entries(this.props)) {
        result[key] = sig;
      }
      result.__dispatch = (eventName: string, detail?: unknown) => {
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
      };
      return result;
    }

    private handleAttributeMutations(mutations: MutationRecord[]) {
      for (const mutation of mutations) {
        if (mutation.type !== "attributes" || !mutation.attributeName) {
          continue;
        }
        const name = normalizeAttributeName(mutation.attributeName);
        const value = this.getAttribute(mutation.attributeName);
        const parsed = parseAttributeValue(value);
        if (this.props[name]) {
          this.props[name].set(parsed);
        } else {
          this.props[name] = signal(parsed);
        }
      }
    }
  }

  if (!customElements.get(name)) {
    customElements.define(name, TerajsCustomElement);
  }
}

