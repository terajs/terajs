/**
 * @file errors.ts
 * @description
 * Shared error types for Terajs's renderer-agnostic layer.
 */
export declare class RendererError extends Error {
    constructor(message: string);
}
export declare class UnsupportedNodeError extends RendererError {
    constructor(type: string);
}
//# sourceMappingURL=errors.d.ts.map