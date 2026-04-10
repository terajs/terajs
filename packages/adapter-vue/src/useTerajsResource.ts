import { getCurrentInstance, onUnmounted, ref, type Ref } from "vue";
import { watchEffect } from "@terajs/reactivity";
import type { Resource, ResourceState } from "@terajs/runtime";

type ResourceSource = ReturnType<Resource<unknown>["source"]>;

/**
 * Vue-facing bridge for observing a Terajs resource.
 */
export interface TerajsVueResourceBridge<TData> {
  /** Reactive data payload synchronized from the Terajs resource. */
  data: Ref<TData | undefined>;
  /** Reactive error value synchronized from the Terajs resource. */
  error: Ref<unknown>;
  /** Reactive state flag synchronized from the Terajs resource. */
  state: Ref<ResourceState>;
  /** Reactive loading indicator synchronized from the Terajs resource. */
  loading: Ref<boolean>;
  /** Reactive source marker (hydration/persistence/network). */
  source: Ref<ResourceSource>;
  /** Re-runs the underlying resource fetcher. */
  refetch: () => Promise<TData>;
  /** Applies optimistic local mutation semantics from the Terajs resource contract. */
  mutate: Resource<TData>["mutate"];
  /** Stops syncing reactive updates into Vue refs. */
  dispose: () => void;
}

/**
 * Bridges a Terajs `Resource` into Vue refs.
 */
export function useTerajsResource<TData>(resource: Resource<TData>): TerajsVueResourceBridge<TData> {
  const data = ref(resource.data()) as Ref<TData | undefined>;
  const error = ref(resource.error()) as Ref<unknown>;
  const state = ref(resource.state()) as Ref<ResourceState>;
  const loading = ref(resource.loading()) as Ref<boolean>;
  const source = ref(resource.source()) as Ref<ResourceSource>;

  const stop = watchEffect(() => {
    data.value = resource.data();
    error.value = resource.error();
    state.value = resource.state();
    loading.value = resource.loading();
    source.value = resource.source();
  });

  if (getCurrentInstance()) {
    onUnmounted(stop);
  }

  return {
    data,
    error,
    state,
    loading,
    source,
    refetch: () => resource.refetch(),
    mutate: resource.mutate,
    dispose: stop
  };
}

/**
 * Alias for teams preferring dependency-injection naming.
 */
export const injectTerajsResource = useTerajsResource;