import type { ReactiveMetadata } from "./metadata";

/**
 * Base shape for all debug events.
 */
export interface DebugEventBase {
  /** Event type discriminator. */
  type: string;
  /** Timestamp when the event occurred. */
  timestamp: number;
}

/**
 * Emitted when a reactive primitive is created.
 */
export interface ReactiveCreatedEvent extends DebugEventBase {
  type: "reactive:created";
  meta: ReactiveMetadata;
}

/**
 * Emitted when a reactive primitive is read.
 */
export interface ReactiveReadEvent extends DebugEventBase {
  type: "reactive:read";
  rid: string;
}

/**
 * Emitted when a reactive primitive is updated.
 */
export interface ReactiveUpdatedEvent extends DebugEventBase {
  type: "reactive:updated";
  rid: string;
  /** Previous value (if serializable). */
  prev?: unknown;
  /** Next value (if serializable). */
  next?: unknown;
}

/**
 * Emitted when a computed value re-runs.
 */
export interface ComputedRecomputedEvent extends DebugEventBase {
  type: "computed:recomputed";
  rid: string;
}

/**
 * Emitted when a component instance mounts.
 */
export interface ComponentMountedEvent extends DebugEventBase {
  type: "component:mounted";
  scope: string;
  instance: number;
}

/**
 * Emitted when a component instance unmounts.
 */
export interface ComponentUnmountedEvent extends DebugEventBase {
  type: "component:unmounted";
  scope: string;
  instance: number;
}

/**
 * Emitted when a DOM node is updated due to reactivity.
 */
export interface DomUpdatedEvent extends DebugEventBase {
  type: "dom:updated";
  /** Reactive identity that triggered this update, if known. */
  rid?: string;
  /** Optional DOM node identifier (e.g. internal id). */
  nodeId?: string;
}

/**
 * Emitted when the current route changes.
 */
export interface RouteChangedEvent extends DebugEventBase {
  type: "route:changed";
  from: string | null;
  to: string;
  params?: Record<string, string>;
  query?: Record<string, string | string[]>;
}

export interface RouterWarningEvent extends DebugEventBase {
  type: "route:warn";
  message: string;
}

export interface RouterErrorEvent extends DebugEventBase {
  type: "error:router";
  message: string;
  to?: string;
}

/**
 * Union of all debug events.
 * * Using these specific types in a switch(event.type) block 
 * allows TypeScript to narrow 'event' to the correct interface, 
 * resolving issues with missing properties like 'to' or 'from'.
 */
export type DebugEvent =
  | ReactiveCreatedEvent
  | ReactiveReadEvent
  | ReactiveUpdatedEvent
  | ComputedRecomputedEvent
  | ComponentMountedEvent
  | ComponentUnmountedEvent
  | DomUpdatedEvent
  | RouteChangedEvent
  | RouterWarningEvent
  | RouterErrorEvent;