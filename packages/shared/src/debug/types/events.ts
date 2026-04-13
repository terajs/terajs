import type { ReactiveMetadata } from "./metadata.js";

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
 * Shared fields for component-scoped debug events.
 */
export interface ComponentDebugEventBase extends DebugEventBase {
  scope: string;
  instance: number;
}

/**
 * Optional component snapshots captured alongside lifecycle or update events.
 */
export interface ComponentSnapshotEventBase extends ComponentDebugEventBase {
  props?: unknown;
  componentProps?: unknown;
  meta?: Record<string, unknown>;
  ai?: Record<string, unknown>;
  route?: Record<string, unknown>;
  state?: unknown;
}

/**
 * Emitted when a component instance mounts.
 */
export interface ComponentMountedEvent extends ComponentDebugEventBase {
  type: "component:mounted";
}

/**
 * Emitted when a component instance unmounts.
 */
export interface ComponentUnmountedEvent extends ComponentDebugEventBase {
  type: "component:unmounted";
}

/**
 * Emitted when a component instance refreshes its rendered or derived state.
 */
export interface ComponentUpdatedEvent extends ComponentSnapshotEventBase {
  type: "component:update";
}

/**
 * Emitted when a component receives new props.
 */
export interface ComponentPropsUpdatedEvent extends ComponentSnapshotEventBase {
  type: "component:props:update";
}

/**
 * Emitted when a component-owned state snapshot changes.
 */
export interface ComponentStateUpdatedEvent extends ComponentSnapshotEventBase {
  type: "component:state:update";
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

export interface RouteMetaResolvedEvent extends DebugEventBase {
  type: "route:meta:resolved";
  to: string;
  meta: Record<string, unknown>;
  ai?: Record<string, unknown>;
  route?: Record<string, unknown>;
}

export interface RouterErrorEvent extends DebugEventBase {
  type: "error:router";
  message: string;
  to?: string;
}

export interface ResourceLoadStartEvent extends DebugEventBase {
  type: "resource:load:start";
  source?: unknown;
  hasInitialValue?: boolean;
}

export interface ResourceLoadEndEvent extends DebugEventBase {
  type: "resource:load:end";
  source?: unknown;
  state: "ready";
}

export interface ResourceErrorEvent extends DebugEventBase {
  type: "resource:error";
  source?: unknown;
  error: unknown;
}

export interface ResourceMutateEvent extends DebugEventBase {
  type: "resource:mutate";
  state: "ready";
}

export interface ResourceInvalidateEvent extends DebugEventBase {
  type: "resource:invalidate";
  keys: string[];
  handlerCount: number;
}

export interface ServerFunctionInvokeEvent extends DebugEventBase {
  type: "server:function:invoke";
  id: string;
  argsCount: number;
  transport: false;
}

export interface ServerFunctionTransportEvent extends DebugEventBase {
  type: "server:function:transport";
  id: string;
  argsCount: number;
  transport: true;
}

export interface ServerFunctionErrorEvent extends DebugEventBase {
  type: "server:function:error";
  id: string;
  message: string;
}

export interface HubConnectEvent extends DebugEventBase {
  type: "hub:connect";
  transport: string;
  url: string;
  retryPolicy?: string;
}

export interface HubDisconnectEvent extends DebugEventBase {
  type: "hub:disconnect";
  transport: string;
  url?: string;
  reason?: string;
}

export interface HubErrorEvent extends DebugEventBase {
  type: "hub:error";
  transport: string;
  message: string;
  call?: string;
}

export interface HubPushReceivedEvent extends DebugEventBase {
  type: "hub:push:received";
  transport: string;
  keys?: string[];
}

export interface HubSyncStartEvent extends DebugEventBase {
  type: "hub:sync:start";
  transport: string;
  call: string;
}

export interface HubSyncCompleteEvent extends DebugEventBase {
  type: "hub:sync:complete";
  transport: string;
  call: string;
  invalidated?: number;
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
  | ComponentUpdatedEvent
  | ComponentPropsUpdatedEvent
  | ComponentStateUpdatedEvent
  | DomUpdatedEvent
  | RouteChangedEvent
  | RouteMetaResolvedEvent
  | RouterWarningEvent
  | RouterErrorEvent
  | ResourceLoadStartEvent
  | ResourceLoadEndEvent
  | ResourceErrorEvent
  | ResourceMutateEvent
  | ResourceInvalidateEvent
  | ServerFunctionInvokeEvent
  | ServerFunctionTransportEvent
  | ServerFunctionErrorEvent
  | HubConnectEvent
  | HubDisconnectEvent
  | HubErrorEvent
  | HubPushReceivedEvent
  | HubSyncStartEvent
  | HubSyncCompleteEvent;