/**
 * @file mount.ts
 * @description
 * Abstract mount/unmount API for Nebula.
 *
 * Renderers implement these functions to define how components are
 * mounted into a root container. The SFC compiler and runtime do not
 * assume DOM or any specific platform.
 */

import type { FrameworkComponent } from "./component";

export interface MountOptions {
  /** Optional props passed to the component. */
  props?: any;
}

/**
 * Mount a component into a platform-specific root container.
 */
export interface MountAPI<Root = any> {
  mount(component: FrameworkComponent, root: Root, options?: MountOptions): void;
  unmount(root: Root): void;
}
