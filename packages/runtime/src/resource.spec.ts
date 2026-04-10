import { beforeEach, describe, expect, it, vi } from "vitest";
import { signal, setRuntimeMode } from "@terajs/reactivity";
import { setHydrationState } from "./hydration";
import { invalidateResources } from "./invalidation";
import { createResource } from "./resource";

describe("createResource", () => {
  beforeEach(() => {
    setRuntimeMode("client");
    setHydrationState({});

    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      }
    });
  });

  it("loads immediately and exposes resolved data", async () => {
    const resource = createResource(async () => "docs");

    expect(resource.loading()).toBe(true);
    await resource.promise();
    expect(resource.data()).toBe("docs");
    expect(resource.state()).toBe("ready");
  });

  it("refetches when the source signal changes", async () => {
    const source = signal("a");
    const resource = createResource(source, async (value) => value.toUpperCase());

    await resource.promise();
    expect(resource.data()).toBe("A");

    source.set("b");
    await Promise.resolve();
    await resource.promise();

    expect(resource.data()).toBe("B");
  });

  it("captures errors and allows mutation", async () => {
    const resource = createResource<string>(async () => {
      throw new Error("boom");
    }, { immediate: false });

    await expect(resource.refetch()).rejects.toThrow("boom");
    expect(resource.state()).toBe("error");
    expect(resource.error()).toBeInstanceOf(Error);

    resource.mutate("fallback");
    expect(resource.data()).toBe("fallback");
    expect(resource.state()).toBe("ready");
  });

  it("reuses hydrated resource data before fetching", async () => {
    setHydrationState({
      resources: {
        greeting: "from-ssr"
      }
    });

    const resource = createResource(async () => "from-fetch", {
      hydrateKey: "greeting"
    });

    expect(resource.data()).toBe("from-ssr");
    expect(resource.state()).toBe("ready");
    expect(resource.promise()).toBeNull();
  });

  it("refetches keyed resources when invalidated", async () => {
    let version = 0;
    const resource = createResource(async () => {
      version += 1;
      return `post-${version}`;
    }, {
      key: "posts"
    });

    await resource.promise();
    expect(resource.data()).toBe("post-1");

    await invalidateResources("posts");

    expect(resource.data()).toBe("post-2");
    expect(resource.state()).toBe("ready");
  });

  it("hydrates from __TERAJS_DATA__ script if available", async () => {
    document.body.innerHTML = `<script id="__TERAJS_DATA__" type="application/json">{"user":{"id":1}}</script>`;

    const fetcher = vi.fn(async () => ({ id: 2 }));
    const res = createResource(() => fetcher(), { key: "user" });

    expect(res.data()).toEqual({ id: 1 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("loads cached local persistence immediately before network resolution", async () => {
    localStorage.setItem("user", JSON.stringify({ id: 1 }));

    const fetcher = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { id: 2 };
    });

    const resource = createResource(() => fetcher(), { persistent: "user" });

    await Promise.resolve();
    expect(resource.data()).toEqual({ id: 1 });
    expect(resource.source()).toBe("persistence");
    expect(fetcher).toHaveBeenCalled();

    await resource.promise();
    expect(resource.data()).toEqual({ id: 2 });
    expect(resource.source()).toBe("network");
    expect(resource.state()).toBe("ready");
  });

  it("uses persistent key as SSR hydrate key when ssr: true is enabled", async () => {
    document.body.innerHTML = `<script id="__TERAJS_DATA__" type="application/json">{"terajs-tasks-v1":[{"title":"cached task"}]}</script>`;

    const fetcher = vi.fn(async () => [{ title: "remote task" }]);
    const resource = createResource(() => fetcher(), { persistent: "terajs-tasks-v1", ssr: true });

    expect(resource.data()).toEqual([{ title: "cached task" }]);
    expect(resource.source()).toBe("hydration");
    expect(fetcher).not.toHaveBeenCalled();
  });
});