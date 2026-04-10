import type { ReactiveMetadata } from "./metadata.js";

/**
 * Runtime information about a component instance.
 */
export interface ComponentInstanceInfo {
  /** Component scope name, e.g. "Counter". */
  scope: string;
  /** Instance id within the scope. */
  instance: number;
  /** Optional route path this instance is associated with. */
  route?: string;
  /** RIDs of reactive primitives owned by this component. */
  reactives: Set<string>;
  /** Internal ids of DOM nodes owned by this component (if tracked). */
  domNodes: Set<string>;
}

/**
 * Runtime information about a reactive primitive.
 */
export interface ReactiveInstanceInfo {
  /** Immutable metadata for this reactive. */
  meta: ReactiveMetadata;
  /** Current value, if we choose to track it for inspection. */
  currentValue?: unknown;
  /** Owning component instance, if any. */
  owner?: {
    scope: string;
    instance: number;
  };
}
