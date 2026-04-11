/**
 * @file renderer.ts
 * @description
 * Runtime-level renderer contract for platform-specific implementation.
 */

export interface Renderer {
  isServer: boolean;
  mount(fn: () => any, container: any): void;
  unmount(container: any): void;
  createPortalContainer(target: string): any;
}

let currentRenderer: Renderer | null = null;

export function setCurrentRenderer(renderer: Renderer): void {
  currentRenderer = renderer;
}

export function getCurrentRenderer(): Renderer {
  if (!currentRenderer) {
    throw new Error("No renderer has been registered for Portal support.");
  }
  return currentRenderer;
}
