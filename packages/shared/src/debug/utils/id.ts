/**
 * Generates a component instance id counter per scope.
 */
const instanceCounters = new Map<string, number>();

/**
 * Returns the next instance id for a given component scope.
 */
export function nextInstanceId(scope: string): number {
  const current = instanceCounters.get(scope) ?? 0;
  const next = current + 1;
  instanceCounters.set(scope, next);
  return next;
}

/**
 * Generates a reactive index counter per component instance + type.
 */
const reactiveCounters = new Map<string, number>();

function reactiveCounterKey(scope: string, instance: number, type: string): string {
  return `${scope}#${instance}.${type}`;
}

/**
 * Returns the next reactive index for a given scope/instance/type.
 */
export function nextReactiveIndex(scope: string, instance: number, type: string): number {
  const key = reactiveCounterKey(scope, instance, type);
  const current = reactiveCounters.get(key) ?? 0;
  const next = current + 1;
  reactiveCounters.set(key, next);
  return next;
}

/**
 * Builds a globally unique reactive identity string (RID).
 * Example: "Counter#1.ref#1"
 */
export function buildRid(
  scope: string,
  instance: number,
  type: string,
  index: number,
  key?: string
): string {
  if (key) {
    return `${scope}#${instance}.${key}`;
  }
  return `${scope}#${instance}.${type}#${index}`;
}

export function resetDebugIdCounters(): void {
  instanceCounters.clear();
  reactiveCounters.clear();
}
