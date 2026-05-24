/**
 * @file analyzer.ts
 * Terajs Reactivity Analyzer (dev-only):
 * Warns about large objects/arrays made reactive, deep reactivity, and suggests markStatic/memo.
 * DX-first: actionable, non-noisy, and opt-in for production builds.
 */
/**
 * Checks if a value is a large array or object and warns if made reactive.
 * @param value - The value being made reactive
 * @param context - Optional context (file, line, etc.)
 */
export declare function analyzeReactivity(value: any, context?: {
    file?: string;
    line?: number;
    key?: string;
}): void;
//# sourceMappingURL=analyzer.d.ts.map