/**
 * Translates a small CSS-like style subset into Android-facing bridge style keys.
 * The mapping stays package-local so native layout concerns do not leak upward.
 */
export declare function normalizeAndroidStyle(viewType: string, style: Record<string, string>): Record<string, string>;
//# sourceMappingURL=styleNormalization.d.ts.map