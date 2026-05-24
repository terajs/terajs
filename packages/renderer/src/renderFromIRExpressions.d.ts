import type { Ref, Signal } from "@terajs/reactivity";
import type { HostIRBindingHint } from "./hostIRTypes.js";
export declare const EXPRESSION_UNWRAP_LOCALS: unique symbol;
export declare function isDirectBindingSource(value: unknown): value is Signal<unknown> | Ref<unknown>;
export declare function resolveDirectTextSource(ctx: any, expr: string): any;
export declare function resolveHintedDirectSource(ctx: any, binding: HostIRBindingHint): any;
export declare function resolveHintedPath(ctx: any, binding: HostIRBindingHint, invokeFinal: boolean): any;
export declare function resolveExpr(ctx: any, expr: string): any;
export declare function resolveEventHandler(ctx: any, expr: string): EventListener | undefined;
//# sourceMappingURL=renderFromIRExpressions.d.ts.map