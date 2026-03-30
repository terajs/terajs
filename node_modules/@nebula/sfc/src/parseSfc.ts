import { ParsedSFC, MetaConfig, RouteOverride } from "./types";
import { parseMiniYAML } from "./parseMiniYAML";

/**
 * Extracts the inner content of a simple block like `<template>...</template>`.
 *
 * @param source - The full SFC source string.
 * @param tag - The tag name to extract (e.g., "template", "script").
 * @returns The trimmed inner content, or null if the block is missing.
 */
function extractBlock(source: string, tag: string): string | null {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const start = source.indexOf(open);
  if (start === -1) return null;
  const end = source.indexOf(close, start + open.length);
  if (end === -1) return null;
  return source.slice(start + open.length, end).trim();
}

/**
 * Parses a Nebula SFC++ source string into a fully structured `ParsedSFC` object.
 *
 * This includes:
 * - extracting `<template>`, `<script>`, `<style>`, `<meta>`, and `<route>` blocks
 * - parsing `<meta>` and `<route>` using Nebula's mini YAML-like parser
 *
 * @param source - The full SFC source string.
 * @param filePath - The file path of the SFC, used for routing inference.
 * @returns A fully parsed `ParsedSFC` object.
 */
export function parseSFC(source: string, filePath: string): ParsedSFC {
  const template = extractBlock(source, "template") ?? "";
  const script = extractBlock(source, "script") ?? "";
  const style = extractBlock(source, "style");

  const metaRaw = extractBlock(source, "meta");
  const routeRaw = extractBlock(source, "route");

  const meta: MetaConfig = parseMiniYAML(metaRaw) ?? {};
  const routeOverride: RouteOverride | null = parseMiniYAML(routeRaw);

  return {
    filePath,
    template,
    script,
    style: style ?? null,
    meta,
    routeOverride
  };
}
