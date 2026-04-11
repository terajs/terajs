/**
 * @file analyzer.ts
 * Terajs Reactivity Analyzer (dev-only):
 * Warns about large objects/arrays made reactive, deep reactivity, and suggests markStatic/memo.
 * DX-first: actionable, non-noisy, and opt-in for production builds.
 */

const LARGE_ARRAY_THRESHOLD = 1000;
const LARGE_OBJECT_THRESHOLD = 100;

/**
 * Checks if a value is a large array or object and warns if made reactive.
 * @param value - The value being made reactive
 * @param context - Optional context (file, line, etc.)
 */
export function analyzeReactivity(value: any, context?: { file?: string; line?: number; key?: string }) {
  if (Array.isArray(value) && value.length > LARGE_ARRAY_THRESHOLD) {
    // eslint-disable-next-line no-console
    console.warn(
      `[Terajs Analyzer] Large array (${value.length} items) made reactive${contextMsg(context)}.\n` +
      `Consider markStatic(arr) or memoization for better performance.`
    );
  } else if (isPlainObject(value) && Object.keys(value).length > LARGE_OBJECT_THRESHOLD) {
    // eslint-disable-next-line no-console
    console.warn(
      `[Terajs Analyzer] Large object (${Object.keys(value).length} keys) made reactive${contextMsg(context)}.\n` +
      `Consider markStatic(obj) or memoization for better performance.`
    );
  }
}

function isPlainObject(val: any): val is object {
  return val && typeof val === "object" && !Array.isArray(val);
}

function contextMsg(ctx?: { file?: string; line?: number; key?: string }) {
  if (!ctx) return "";
  let msg = " (";
  if (ctx.file) msg += ctx.file;
  if (ctx.line) msg += ":" + ctx.line;
  if (ctx.key) msg += ", key: " + ctx.key;
  msg += ")";
  return msg;
}
