/**
 * Metadata describing a reactive primitive.
 * Used for grouping, tracing, and diagnostics.
 */
export type ReactiveType =
  | "ref"
  | "signal"
  | "reactive"
  | "shallowReactive"
  | "readonly"
  | "computed"
  | "effect";

export interface ReactiveMetadata {
  /** Globally unique reactive identity, e.g. "Counter#1.ref#1" */
  rid: string;
  /** Kind of reactive primitive. */
  type: ReactiveType;
  /** Component/function scope name, e.g. "Counter". */
  scope: string;
  /** Instance number within the scope, e.g. 1, 2, 3. */
  instance: number;
  /** Optional human-friendly key (usually inferred variable name). */
  key?: string;
  /** Source file where this reactive was created. */
  file?: string;
  /** Line number in source file. */
  line?: number;
  /** Column number in source file. */
  column?: number;
  /** Creation timestamp (ms since epoch). */
  createdAt: number;
  /** Optional composable information for this reactive. */
  composable?: string;
  /** Optional group name for this reactive. */
  group?: string;
}
