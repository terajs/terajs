import { getCurrentComposable } from "./core/registry.js";
import type { ReactiveMetadata, ReactiveType } from "./types/metadata.js";
import { buildRid, nextReactiveIndex } from "./utils/id.js";

/**
 * Creates a metadata packet for a reactive primitive.
 * This should be called exactly once per reactive creation.
 */
export function createReactiveMetadata(options: {
  type: ReactiveType;
  scope: string;
  instance: number;
  key?: string;
  file?: string;
  line?: number;
  column?: number;
  composable?: string;
  group?: string;
}): ReactiveMetadata {
  const index = nextReactiveIndex(options.scope, options.instance, options.type);
  const rid = buildRid(options.scope, options.instance, options.type, index, options.key);

  return {
    rid,
    type: options.type,
    scope: options.scope,
    instance: options.instance,
    key: options.key,
    file: options.file,
    line: options.line,
    column: options.column,
    createdAt: Date.now(),
    composable: getCurrentComposable() ?? options.composable ?? undefined,
    group: options.group
  };
}
