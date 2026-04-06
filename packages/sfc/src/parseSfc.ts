import { ParsedSFC, MetaConfig, RouteOverride } from "./types";
import { parseMiniYAML } from "./parseMiniYAML";

/**
 * Extracts a block with attributes and content.
 *
 * Matches patterns like:
 *   <style scoped lang="scss"> ... </style>
 *   <script lang="ts"> ... </script>
 *
 * @param source - Full SFC source
 * @param tag - Block tag name (template, script, style, etc.)
 * @returns Object with { attrs, content } or null if block missing
 */
function extractBlockWithAttributes(
  source: string,
  tag: string
): { attrs: string; content: string } | null {
  const regex = new RegExp(
    `<${tag}([^>]*)>([\\s\\S]*?)</${tag}>`,
    "i"
  );

  const match = source.match(regex);
  if (!match) return null;

  return {
    attrs: match[1] ?? "",
    content: match[2].trim()
  };
}

/**
 * Parses a <template> block.
 * Currently no attributes are supported, but this is future‑proof.
 */
function parseTemplateBlock(source: string): ParsedSFC["template"] {
  const raw = extractBlockWithAttributes(source, "template");
  if (!raw) return "";
  return raw.content;
}

/**
 * Parses a <script> block.
 * Supports: <script>, <script lang="ts">
 */
function parseScriptBlock(source: string): ParsedSFC["script"] {
  const raw = extractBlockWithAttributes(source, "script");
  if (!raw) return "";

  const langMatch = raw.attrs.match(/\blang=["'](\w+)["']/i);
  const lang = langMatch?.[1];

  return lang
    ? { content: raw.content, lang }
    : raw.content;
}

/**
 * Parses a <style> block.
 * Supports: <style>, <style scoped>, <style lang="scss">
 */
function parseStyleBlock(source: string): ParsedSFC["style"] {
  const raw = extractBlockWithAttributes(source, "style");
  if (!raw) return null;

  const scoped = /\bscoped\b/i.test(raw.attrs);
  const langMatch = raw.attrs.match(/\blang=["'](\w+)["']/i);
  const lang = langMatch?.[1];

  return {
    content: raw.content,
    ...(scoped ? { scoped: true } : {}),
    ...(lang ? { lang } : {})
  };
}

/**
 * Parses a YAML-like block (<meta>, <route>, <ai>).
 */
function parseYamlBlock<T = any>(
  source: string,
  tag: string
): T | null {
  const raw = extractBlockWithAttributes(source, tag);
  if (!raw) return null;
  return parseMiniYAML(raw.content) ?? null;
}

/**
 * Nebula SFC parser: always treats <script> as setup context.
 * No <script setup> needed—just use <script> for all setup logic.
 *
 * Supported blocks: <template>, <script>, <style>, <meta>, <route>, <ai>
 *
 * Example:
 * <template>...</template>
 * <script>/* setup logic *&#47;</script>
 * <style>...</style>
 * <meta>title: ...</meta>
 * <ai>keywords: ...</ai>
 */
export function parseSFC(source: string, filePath: string): ParsedSFC {
  const template = parseTemplateBlock(source);
  const script = parseScriptBlock(source);
  const style = parseStyleBlock(source);

  const meta: MetaConfig = parseYamlBlock(source, "meta") ?? {};
  const routeOverride: RouteOverride | null = parseYamlBlock(source, "route");

  const ai = parseYamlBlock(source, "ai") ?? undefined;

  // Normalize AI keywords
  if (ai && typeof ai.keywords === "string") {
    ai.keywords = ai.keywords
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  return {
    filePath,
    template,
    script,
    style,
    meta,
    ai,
    routeOverride
  };
}
