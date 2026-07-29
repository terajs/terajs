/**
 * @file index.ts
 * @description Entry point for SFC parsing and type definitions.
 */

export * from "./parseSfc.js";
export type { MetaConfig, ParsedSFC, RouteOverride } from "./types.js";
export * from "./errors.js";
export * from "./compileTemplate.js";
export * from "./compileScript.js";
