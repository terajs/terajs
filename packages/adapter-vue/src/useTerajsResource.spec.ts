import { describe, expect, it, vi } from "vitest";
import { signal, type Signal } from "@terajs/reactivity";
import type { Resource, ResourceState } from "@terajs/runtime";
import { injectTerajsResource, useTerajsResource } from "./useTerajsResource";

type ResourceSource = ReturnType<Resource<unknown>["source"]>;

interface TestResource<TData> {
  resource: Resource<TData>;
  data: Signal<TData | undefined>;
  refetch: ReturnType<typeof vi.fn>;
}

function createTestResource(initial: number): TestResource<number> {
  const data = signal<number | undefined>(initial);
  const error = signal<unknown>(undefined);
  const state = signal<ResourceState>("ready");
  const source = signal<ResourceSource>("network");
  const refetch = vi.fn(async () => data() ?? 0);

  const resource: Resource<number> = {
    data,
    error,
    state,
    loading: () => state() === "pending",
    latest: () => data(),
    source: () => source(),
    promise: () => null,
    refetch,
    mutate: (value) => {
      const next = typeof value === "function"
        ? (value as (current: number | undefined) => number)(data())
        : value;
      data.set(next);
      state.set("ready");
      error.set(undefined);
    }
  };

  return {
    resource,
    data,
    refetch
  };
}

describe("adapter-vue useTerajsResource", () => {
  it("bridges resource signals into Vue refs", () => {
    const testResource = createTestResource(1);
    const bridge = useTerajsResource(testResource.resource);

    expect(bridge.data.value).toBe(1);
    expect(bridge.loading.value).toBe(false);

    bridge.mutate(5);
    expect(bridge.data.value).toBe(5);

    bridge.dispose();
    testResource.resource.mutate(8);
    expect(bridge.data.value).toBe(5);
  });

  it("supports injectTerajsResource alias and refetch passthrough", async () => {
    const testResource = createTestResource(3);
    const bridge = injectTerajsResource(testResource.resource);

    await bridge.refetch();

    expect(testResource.refetch).toHaveBeenCalledTimes(1);

    bridge.dispose();
  });
});
