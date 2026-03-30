/**
 * A tiny YAML-like parser for Nebula SFC blocks.
 *
 * Supports:
 * - `key: value`
 * - nested objects via indentation
 * - lists using `- item`
 * - numbers, booleans, and strings
 * - no external dependencies
 *
 * This parser is intentionally minimal and designed specifically for
 * Nebula SFC++ metadata and route blocks.
 *
 * @param raw - The raw YAML-like string extracted from an SFC block.
 * @returns A parsed JavaScript object, or null if the block is empty.
 */
export declare function parseMiniYAML(raw: string | null): any;
