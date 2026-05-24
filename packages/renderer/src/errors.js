/**
 * @file errors.ts
 * @description
 * Shared error types for Terajs's renderer-agnostic layer.
 */
export class RendererError extends Error {
    constructor(message) {
        super(message);
        this.name = "RendererError";
    }
}
export class UnsupportedNodeError extends RendererError {
    constructor(type) {
        super(`Renderer does not support AST node type: ${type}`);
    }
}
