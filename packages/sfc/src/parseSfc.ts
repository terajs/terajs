import { ParsedSFC, MetaConfig, RouteOverride } from "./types.js";
import { parseMiniYAML } from "./parseMiniYAML.js";
import { createSfcError } from "./errors.js";

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
function parseTemplateBlock(source: string): string {
  const raw = extractBlockWithAttributes(source, "template");
  if (!raw) return "";
  return raw.content;
}

function getPosition(source: string, index: number) {
  const lines = source.slice(0, index).split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1]?.length + 1 || 1;
  return { line, column };
}

/**
 * Performs a shallow scan of the template to catch structural syntax errors.
 * @throws {SfcError} if the template is malformed.
 */
function validateTemplateStructure(template: string, source: string, filePath: string) {
  if (!template) return;

  const emptyMatch = template.match(/\{\{\s*\}\}/);
  if (emptyMatch) {
    const templateOffset = source.indexOf(template);
    const absoluteIndex = (templateOffset !== -1 ? templateOffset : 0) + emptyMatch.index!;
    const { line, column } = getPosition(source, absoluteIndex);
    throw createSfcError(
      "Empty reactive expression '{{ }}' found.",
      line,
      column,
      filePath,
      source
    );
  }

  const tags = template.match(/<\s*(\/?)\s*([a-zA-Z0-9-]+)([^>]*?)>/g) || [];
  const stack: Array<{ tag: string; index: number }> = [];

  for (const rawTag of tags) {
    const match = rawTag.match(/<\s*(\/?)\s*([a-zA-Z0-9-]+)([^>]*?)>/);
    if (!match) continue;

    const isClosing = !!match[1];
    const tagName = match[2];
    const attrs = match[3] ?? "";
    const selfClosing = /\/\s*$/.test(attrs);
    const sourceIndex = source.indexOf(rawTag, source.indexOf(template));

    if (isClosing) {
      const opening = stack.pop();
      if (!opening || opening.tag !== tagName) {
        const { line, column } = getPosition(source, sourceIndex);
        throw createSfcError(
          `Mismatched or unclosed tag: expected </${opening?.tag ?? "?"}> but found </${tagName}>.`,
          line,
          column,
          filePath,
          source
        );
      }
      continue;
    }

    if (!selfClosing) {
      stack.push({ tag: tagName, index: sourceIndex });
    }
  }

  if (stack.length > 0) {
    const opening = stack[stack.length - 1];
    const { line, column } = getPosition(source, opening.index);
    throw createSfcError(
      `Unclosed tag <${opening.tag}> found.`,
      line,
      column,
      filePath,
      source
    );
  }
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
 * Terajs SFC parser: always treats <script> as setup context.
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
 *
 * Note: `<ai>` blocks are parsed as instructional metadata only and are not executable.
 */
export function parseSFC(source: string, filePath: string): ParsedSFC {
  const template = parseTemplateBlock(source);
  validateTemplateStructure(template, source, filePath);

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
