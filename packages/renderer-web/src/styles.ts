/**
 * @file styles.ts
 * @description
 * Manages injected stylesheet registry for renderer-web.
 */

type RegisteredStyle = {
  id: string;
  css: string;
  persistent: boolean;
  element: HTMLStyleElement;
};

const styleRegistry = new Map<string, RegisteredStyle>();

export function registerStyle(id: string, css: string, isPersistent = false): void {
  if (styleRegistry.has(id)) {
    return;
  }

  const element = document.createElement("style");
  element.type = "text/css";
  element.dataset.terajsStyle = id;
  element.textContent = css;
  document.head.appendChild(element);

  styleRegistry.set(id, {
    id,
    css,
    persistent: isPersistent,
    element
  });
}

export function unregisterStyle(id: string): void {
  const registered = styleRegistry.get(id);
  if (!registered || registered.persistent) {
    return;
  }

  registered.element.remove();
  styleRegistry.delete(id);
}

export function hasStyle(id: string): boolean {
  return styleRegistry.has(id);
}
