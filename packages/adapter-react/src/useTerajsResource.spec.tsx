import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { signal, type Signal } from "@terajs/reactivity";
import type { Resource, ResourceState } from "@terajs/runtime";
import { useTerajsResource, type TerajsResourceBridge } from "./useTerajsResource";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type ResourceSource = ReturnType<Resource<unknown>["source"]>;

interface TestResource<TData> {
  resource: Resource<TData>;
  data: Signal<TData | undefined>;
  error: Signal<unknown>;
  state: Signal<ResourceState>;
  source: Signal<ResourceSource>;
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
    error,
    state,
    source,
    refetch
  };
}

describe("adapter-react useTerajsResource", () => {
  it("tracks resource updates in React state", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const testResource = createTestResource(1);

    function Probe({ resource }: { resource: Resource<number> }) {
      const bridge = useTerajsResource(resource);
      return (
        <div data-state={bridge.state} data-loading={String(bridge.loading)}>
          {String(bridge.data)}
        </div>
      );
    }

    await act(async () => {
      root.render(<Probe resource={testResource.resource} />);
    });

    expect(container.textContent).toBe("1");

    await act(async () => {
      testResource.resource.mutate(2);
    });

    expect(container.textContent).toBe("2");

    await act(async () => {
      root.unmount();
    });
  });

  it("exposes refetch and mutate bridge methods", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const testResource = createTestResource(4);
    let bridgeSnapshot: TerajsResourceBridge<number> | null = null;

    function Capture({ resource }: { resource: Resource<number> }) {
      bridgeSnapshot = useTerajsResource(resource);
      return null;
    }

    await act(async () => {
      root.render(<Capture resource={testResource.resource} />);
    });

    await act(async () => {
      bridgeSnapshot?.mutate(9);
    });

    expect(testResource.data()).toBe(9);

    await act(async () => {
      await bridgeSnapshot?.refetch();
    });

    expect(testResource.refetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });
});
