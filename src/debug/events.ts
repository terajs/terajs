/**
 * @file events.ts
 * @description
 * Nebula's internal debugging substrate.
 *
 * This module provides a tiny, zero‑overhead event bus used by the core
 * runtime (reactivity, renderer, components, templates, contracts, etc.)
 * to emit structured debug events.
 *
 * It is:
 * - internal (not part of the public API)
 * - tree‑shakeable (no listeners = no work)
 * - transport‑agnostic (devtools, logs, visualizers can subscribe)
 *
 * No UI. No logging. Just a structured event stream.
 */

/* -------------------------------------------------------------------------- */
/*                               Event Taxonomy                               */
/* -------------------------------------------------------------------------- */

export type DebugEventType =
    /* ------------------------------ Reactivity ------------------------------ */
     
    // State
    | "state:create"
    | "state:get"
    | "state:set"
    | "state:link"
    | "state:update"
    | "state:read"

    // Signals / refs
    | "signal:create"
    | "signal:update"
    | "signal:read"
    | "signal:link"
    | "signal:unlink"
    | "ref:create"
    | "ref:get"
    | "ref:set"

    // Effects
    | "effect:create"
    | "effect:schedule"
    | "effect:run"
    | "effect:cleanup"
    | "effect:dispose"
    | "effect:getCurrent"

    // Batching
    | "batch:start"
    | "batch:end"
    | "batch:flush"
    | "batch:run"
    | "batch:queue"

    // Computed
    | "computed:create"
    | "computed:update"

    // Reactive objects
    | "reactive:create"
    | "reactive:get"
    | "reactive:set"

    | "model:create"
    | "model:update"
    | "model:update:child-to-parent"
    | "model:update:parent-to-child"

    // cleanup
    | "effect:cleanup:register"

    // contracts
    | "contract:create"
    | "contract:reactive:create"
    | "contract:reactive:wrap"

    // dispose
    | "effect:dispose:start"
    | "effect:dispose:cleanup"
    | "effect:dispose:deps"
    | "effect:dispose:end"

    // runtime mode
    | "runtime:mode:set"
    | "runtime:mode:check"

    // watchers
    | "watch:create"
    | "watch:source"
    | "watch:callback"
    | "watch:cleanup"
    | "watch:stop"

    // watchEffect
    | "watchEffect:create"
    | "watchEffect:run"
    | "watchEffect:cleanup"
    | "watchEffect:stop"
    /* ------------------------------- Renderer ------------------------------- */

    // context
    | "component:context:get"
    | "component:context:set"
    | "component:context:create"
    | "component:context:cleanup"
    | "component:cleanup:register"
    | "component:render:root"
    | "component:render:start"
    | "component:render:static"
    | "component:render:template"
    | "component:render:end"
    // DOM nodes
    | "dom:create"
    | "dom:insert"
    | "dom:remove"
    | "dom:update"
    | "dom:replace"

    // Fragments
    | "dom:fragment:create"
    | "dom:fragment:insert"
    | "dom:fragment:remove"

    // Keyed diff
    | "dom:keyed-diff:start"
    | "dom:keyed-diff:move"
    | "dom:keyed-diff:insert"
    | "dom:keyed-diff:remove"
    | "dom:keyed-diff:end"

    // Hydration (future)
    | "dom:hydrate:start"
    | "dom:hydrate:end"

    // Unwrapping
    | "unwrap:ref"
    | "unwrap:signal"
    | "unwrap:accessor"
    | "unwrap:raw"

    // Keyed list reconciliation
    | "list:diff:sync-start"
    | "list:diff:sync-end"
    | "list:diff:mount"
    | "list:diff:unmount"
    | "list:diff:move"
    | "list:diff:lis"
    | "list:diff:end"
    | "list:diff:start"

    /* ------------------------------ Components ------------------------------ */

    | "component:create"
    | "component:mount"
    | "component:update"
    | "component:unmount"
    | "component:props:update"
    | "component:state:update"
    | "component:dispose"

    /* ------------------------------- Templates ------------------------------ */
    | "template:branch"
    | "template:fallback"
    | "template:create"
    | "template:mount"
    | "template:update"
    | "template:unmount"
    | "template:replace"
    | "template:dispose"

    // Bindings
    | "binding:create"
    | "binding:update"
    | "binding:dispose"

    /* -------------------------------- Contracts ----------------------------- */

    | "contract:create"
    | "contract:update"
    | "contract:dispose"

    /* --------------------------------- Errors ------------------------------- */

    | "error:reactivity"
    | "error:renderer"
    | "error:component"
    | "error:template"
    | "error:contract"
    | "error:unknown"

    /* ------------------------------ List ----------------------------- */
    | "list:create"
    | "list:update"
    | "list:reconcile"
    | "list:mount"
    | "list:unmount"
    
    /* ------------------------------ JSX Runtime ------------------------------ */
    | "jsx:create"
    | "jsx:fragment"
    | "jsx:component"
    | "jsx:children"
    | "jsx:element"
    | "jsx:props"
    | "jsx:normalize"
    ;

/* -------------------------------------------------------------------------- */
/*                               Event Payload                                */
/* -------------------------------------------------------------------------- */

/**
 * Generic debug event payload.
 * Each event type can narrow this via discriminated unions later.
 */
export interface DebugEvent<TType extends DebugEventType = DebugEventType> {
    type: TType;
    timestamp: number;
    payload: any;
}

/**
 * Debug event handler signature.
 */
export type DebugHandler = (event: DebugEvent) => void;

/* -------------------------------------------------------------------------- */
/*                               Event Bus Core                               */
/* -------------------------------------------------------------------------- */

const handlers = new Set<DebugHandler>();

/**
 * Internal debug bus.
 *
 * Not exported as a default; consumers import `Debug` explicitly.
 */
export const Debug = {
    /**
     * Subscribe to all debug events.
     *
     * Intended for devtools, logging, and diagnostics.
     *
     * @param handler - A function that receives every debug event.
     * @returns An unsubscribe function.
     */
    on(handler: DebugHandler): () => void {
        handlers.add(handler);
        return () => handlers.delete(handler);
    },

    /**
     * Emit a debug event.
     *
     * This is used internally by Nebula's core modules.
     * If no handlers are registered, this is effectively a no‑op.
     *
     * @param type - The event type.
     * @param payload - Arbitrary event data.
     */
    emit<TType extends DebugEventType>(type: TType, payload: any): void {
        if (handlers.size === 0) return;

        const event: DebugEvent<TType> = {
            type,
            timestamp: Date.now(),
            payload,
        };

        for (const handler of handlers) {
            try {
                handler(event);
            } catch {
                // Debug handlers must never break the runtime.
            }
        }
    },
};
