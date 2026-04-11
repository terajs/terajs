import { useEffect, useMemo, useState } from "react";
import { watchEffect } from "@terajs/reactivity";
import type { Resource, ResourceState } from "@terajs/runtime";

type ResourceSource = ReturnType<Resource<unknown>["source"]>;

interface TerajsResourceStateSnapshot<TData> {
  data: TData | undefined;
  error: unknown;
  state: ResourceState;
  loading: boolean;
  source: ResourceSource;
}

/**
 * React-facing snapshot for a Terajs resource.
 */
export interface TerajsResourceBridge<TData> extends TerajsResourceStateSnapshot<TData> {
  /** Re-runs the underlying resource fetcher. */
  refetch: () => Promise<TData>;
  /** Applies optimistic local mutation semantics from the Terajs resource contract. */
  mutate: Resource<TData>["mutate"];
}

function readSnapshot<TData>(resource: Resource<TData>): TerajsResourceStateSnapshot<TData> {
  return {
    data: resource.data(),
    error: resource.error(),
    state: resource.state(),
    loading: resource.loading(),
    source: resource.source()
  };
}

function isSnapshotEqual<TData>(
  left: TerajsResourceStateSnapshot<TData>,
  right: TerajsResourceStateSnapshot<TData>
): boolean {
  return (
    Object.is(left.data, right.data)
    && Object.is(left.error, right.error)
    && left.state === right.state
    && left.loading === right.loading
    && left.source === right.source
  );
}

/**
 * Bridges a Terajs `Resource` into React state semantics.
 *
 * This hook lets React components observe Terajs local-first resources while
 * preserving Terajs runtime behavior (`mutate`, `refetch`, queue integration).
 */
export function useTerajsResource<TData>(resource: Resource<TData>): TerajsResourceBridge<TData> {
  const [snapshot, setSnapshot] = useState<TerajsResourceStateSnapshot<TData>>(() => readSnapshot(resource));

  useEffect(() => {
    setSnapshot(readSnapshot(resource));

    const stop = watchEffect(() => {
      const nextSnapshot = readSnapshot(resource);
      setSnapshot((current) => (isSnapshotEqual(current, nextSnapshot) ? current : nextSnapshot));
    });

    return stop;
  }, [resource]);

  const bridgeApi = useMemo(() => ({
    refetch: () => resource.refetch(),
    mutate: resource.mutate
  }), [resource]);

  return {
    ...snapshot,
    ...bridgeApi
  };
}