/**
 * @file events.ts
 * @description
 * Terajs's internal debugging substrate.
 */

// Import the graph logic to satisfy the proxy method
import { addDependency as addGraphEdge } from "./dependencyGraph.js";

/* -------------------------------------------------------------------------- */
/*                               Event Taxonomy                               */
/* -------------------------------------------------------------------------- */
export type DebugEventType =
    /* ------------------------------ Reactivity ------------------------------ */
    | "state:create" | "state:get" | "state:set" | "state:link" | "state:update" | "state:read"
    | "signal:create" | "signal:update" | "signal:read" | "signal:link" | "signal:unlink"
    | "ref:create" | "ref:get" | "ref:set"
    | "effect:create" | "effect:schedule" | "effect:run" | "effect:cleanup" | "effect:dispose" | "effect:getCurrent"
    | "batch:start" | "batch:end" | "batch:flush" | "batch:run" | "batch:queue"
    | "computed:create" | "computed:update" | "computed:recomputed"
    | "reactive:create" | "reactive:created" | "reactive:get" | "reactive:set" | "reactive:read" | "reactive:updated"
    | "model:create" | "model:update" | "model:update:child-to-parent" | "model:update:parent-to-child"
    | "effect:cleanup:register"
    | "contract:create" | "contract:reactive:create" | "contract:reactive:wrap"
    | "effect:dispose:start" | "effect:dispose:cleanup" | "effect:dispose:deps" | "effect:dispose:end"
    | "runtime:mode:set" | "runtime:mode:check"
    | "watch:create" | "watch:source" | "watch:callback" | "watch:cleanup" | "watch:stop"
    | "watchEffect:create" | "watch:dispose" | "watchEffect:run" | "watchEffect:cleanup" | "watchEffect:stop"
    | "resource:load:start" | "resource:load:end" | "resource:error" | "resource:mutate" | "resource:invalidate"
    | "queue:enqueue" | "queue:retry" | "queue:flush" | "queue:drained" | "queue:fail" | "queue:conflict"
    | "queue:backoff" | "queue:skip:backoff" | "queue:skip:missing-handler"
    | "server:function:invoke" | "server:function:transport" | "server:function:error"
    | "hub:connect" | "hub:disconnect" | "hub:error" | "hub:push:received" | "hub:sync:start" | "hub:sync:complete"

    /* ------------------------------- Renderer ------------------------------- */
    | "component:context:get" | "component:context:set" | "component:context:create" | "component:context:cleanup"
    | "component:cleanup:register" | "component:setup:start" | "component:setup:end"
    | "component:render:root" | "component:render:start" | "component:render:static" | "component:render:template" | "component:render:end"
    | "dom:create" | "dom:insert" | "dom:remove" | "dom:update" | "dom:replace" | "dom:clear"
    | "dom:fragment:create" | "dom:fragment:insert" | "dom:fragment:remove"
    | "dom:keyed-diff:start" | "dom:keyed-diff:move" | "dom:keyed-diff:insert" | "dom:keyed-diff:remove" | "dom:keyed-diff:end"
    | "dom:hydrate:start" | "dom:hydrate:end"
    | "unwrap:ref" | "unwrap:signal" | "unwrap:accessor" | "unwrap:raw"
    | "list:diff:sync-start" | "list:diff:sync-end" | "list:diff:mount" | "list:diff:unmount" | "list:diff:move" | "list:diff:lis" | "list:diff:end" | "list:diff:start"

    /* ------------------------------ Components ------------------------------ */
    | "component:create" | "component:mount" | "component:update" | "component:unmount"
    | "component:props:update" | "component:state:update" | "component:dispose"

    /* -------------------------------- Routing ------------------------------- */
    | "route:changed" | "route:navigate:start" | "route:navigate:end" | "route:load:start" | "route:load:end"
    | "route:redirect" | "route:blocked" | "route:warn" | "route:meta:resolved" | "error:router"

    /* ------------------------------- Templates ------------------------------ */
    | "template:branch" | "template:fallback" | "template:create" | "template:mount"
    | "template:update" | "template:unmount" | "template:replace" | "template:dispose" | "template:empty"

    /* ------------------------------- Bindings ------------------------------- */
    | "binding:create"
    | "binding:update"
    | "binding:dispose"
    
    /* ------------------------------- AST Rendering --------------------------- */
    | "template:ast:render"
    | "template:ast:text"
    | "template:ast:interp"
    | "template:ast:element"
    | "template:ast:portal"
    | "template:ast:slot"
    | "template:ast:if"
    | "template:ast:for"

    /* -------------------------------- Contracts ----------------------------- */
    | "contract:update" | "contract:dispose"

    /* --------------------------------- Errors ------------------------------- */
    | "error:reactivity" | "error:renderer" | "error:component"
    | "error:template" | "error:contract" | "error:unknown"

    /* ------------------------------ List ------------------------------------ */
    | "list:create" | "list:update" | "list:reconcile" | "list:mount" | "list:unmount"

    /* ------------------------------ JSX Runtime ------------------------------ */
    | "jsx:create" | "jsx:fragment" | "jsx:component" | "jsx:children"
    | "jsx:element" | "jsx:props" | "jsx:normalize"
    | "lifecycle:warn"

    /* ------------------------------ IR Rendering ----------------------------- */
    | "ir:render:module"
    | "ir:render:text"
    | "ir:render:interp"
    | "ir:render:element"
    | "ir:render:portal"
    | "ir:render:slot"
    | "ir:render:if"
    | "ir:render:for"
    | "ir:render:prop:skip"
    
    /* ------------------------------ HMR ------------------------------ */
    | "hmr:register"
    | "hmr:update:setup"
    | "hmr:update:ir"
    | "hmr:update:instance"
    | "hmr:update:component"
    
    /* ------------------------------ SFC ------------------------------ */
    | "sfc:load"
    | "sfc:hmr";


/* -------------------------------------------------------------------------- */
/*                               Event Payload                                */
/* -------------------------------------------------------------------------- */

export interface DebugEvent<TType extends DebugEventType = DebugEventType> {
    type: TType;
    timestamp: number;
    payload: any;
}

export type DebugHandler = (event: DebugEvent) => void;

interface DevtoolsHook {
    emit(event: DebugEvent): void;
}

/* -------------------------------------------------------------------------- */
/*                               Event Bus Core                               */
/* -------------------------------------------------------------------------- */

const handlers = new Set<DebugHandler>();

function getGlobalDevtoolsHook(): DevtoolsHook | undefined {
    if (typeof globalThis !== "object" || globalThis === null) {
        return undefined;
    }

    return (globalThis as typeof globalThis & {
        __TERAJS_DEVTOOLS_HOOK__?: DevtoolsHook;
    }).__TERAJS_DEVTOOLS_HOOK__;
}

export const Debug = {
    on(handler: DebugHandler): () => void {
        handlers.add(handler);
        return () => handlers.delete(handler);
    },

    /**
     * Proxies to the dependency graph.
     * Fixes TS2339: Property 'addDependency' does not exist on type...
     */
    addDependency(fromRid: string, toRid: string): void {
        addGraphEdge(fromRid, toRid);
    },

    emit<TType extends DebugEventType>(type: TType, payload: any): void {
        const hook = getGlobalDevtoolsHook();
        
        if (handlers.size === 0 && !hook) return;

        const event: DebugEvent<TType> = {
            type,
            timestamp: Date.now(),
            payload,
        };

        for (const handler of handlers) {
            try {
                handler(event);
            } catch {
                // Ignore errors in debug handlers
            }
        }

        if (hook) {
            hook.emit(event);
        }
    },
};

export function resetDebugHandlers(): void {
    handlers.clear();
}
