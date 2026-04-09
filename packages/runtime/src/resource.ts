import { effect, getCurrentEffect, signal, type Signal } from "@terajs/reactivity";
import { Debug } from "@terajs/shared";
import { onCleanup } from "./component/component";
import { getCurrentContext } from "./component/context";
import { consumeHydratedResource } from "./hydration";
import { registerResourceInvalidation, type ResourceKey } from "./invalidation";

export type ResourceState = "idle" | "pending" | "ready" | "error";
function getHydratedData<TValue = unknown>(key: string): TValue | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }

  const el = document.getElementById("__TERAJS_DATA__");
  if (!el) return undefined;

  try {
    const raw = el.textContent || "{}";
    const data = JSON.parse(raw) as Record<string, unknown>;
    return data[key] as TValue | undefined;
  } catch {
    return undefined;
  }
}
export interface Resource<TData> {
  data: Signal<TData | undefined>;
  error: Signal<unknown>;
  state: Signal<ResourceState>;
  loading: () => boolean;
  latest: () => TData | undefined;
  promise: () => Promise<TData> | null;
  refetch: () => Promise<TData>;
  mutate: (value: TData | ((current: TData | undefined) => TData)) => void;
}

type ResourceFetcher<TSource, TData> = (source: TSource) => Promise<TData> | TData;

interface ResourceOptions<TData> {
  initialValue?: TData;
  immediate?: boolean;
  hydrateKey?: string;
  key?: ResourceKey | ResourceKey[];
}

export function createResource<TData>(
  fetcher: () => Promise<TData> | TData,
  options?: ResourceOptions<TData>
): Resource<TData>;
export function createResource<TSource, TData>(
  source: () => TSource,
  fetcher: ResourceFetcher<TSource, TData>,
  options?: ResourceOptions<TData>
): Resource<TData>;
export function createResource<TSource, TData>(
  sourceOrFetcher: (() => TSource) | (() => Promise<TData> | TData),
  maybeFetcher?: ResourceFetcher<TSource, TData> | ResourceOptions<TData>,
  maybeOptions?: ResourceOptions<TData>
): Resource<TData> {
  const hasSource = typeof maybeFetcher === "function";
  const source = hasSource ? (sourceOrFetcher as () => TSource) : undefined;
  const fetcher = (hasSource
    ? maybeFetcher
    : sourceOrFetcher) as ResourceFetcher<TSource | void, TData>;
  const options = (hasSource ? maybeOptions : maybeFetcher) as ResourceOptions<TData> | undefined;
  const hydrationKey = options?.hydrateKey ?? (typeof options?.key === "string" ? options.key : undefined);
  const hydratedValue = hydrationKey
    ? consumeHydratedResource<TData>(hydrationKey) ?? getHydratedData<TData>(hydrationKey)
    : undefined;
  const initialValue = hydratedValue !== undefined ? hydratedValue : options?.initialValue;

  const data = signal<TData | undefined>(initialValue);
  const error = signal<unknown>(undefined);
  const state = signal<ResourceState>(initialValue !== undefined ? "ready" : "idle");

  let currentPromise: Promise<TData> | null = null;
  let requestVersion = 0;
  let currentSource: TSource | void = undefined;

  const execute = async (value: TSource | void): Promise<TData> => {
    const version = requestVersion + 1;
    requestVersion = version;
    currentSource = value;
    state.set("pending");
    error.set(undefined);

    Debug.emit("resource:load:start", {
      source: value,
      hasInitialValue: data() !== undefined
    });

    const pending = Promise.resolve(fetcher(value));
    currentPromise = pending;

    try {
      const resolved = await pending;
      if (version !== requestVersion) {
        return resolved;
      }

      data.set(resolved);
      state.set("ready");
      error.set(undefined);
      Debug.emit("resource:load:end", {
        source: value,
        state: "ready"
      });
      return resolved;
    } catch (resourceError) {
      if (version !== requestVersion) {
        throw resourceError;
      }

      error.set(resourceError);
      state.set("error");
      Debug.emit("resource:error", {
        source: value,
        error: resourceError instanceof Error ? resourceError.message : resourceError
      });
      throw resourceError;
    } finally {
      if (version === requestVersion) {
        currentPromise = null;
      }
    }
  };

  if (source) {
    let initialized = false;
    if (hydratedValue !== undefined) {
      initialized = true;
      currentSource = source();
    }

    const runFromSource = () => {
      const nextSource = source();
      if (!initialized || !Object.is(nextSource, currentSource)) {
        initialized = true;
        void execute(nextSource);
      }
    };

    if (options?.immediate !== false && hydratedValue === undefined) {
      runFromSource();
    }

    effect(() => {
      const nextSource = source();
      if (!initialized || !Object.is(nextSource, currentSource)) {
        initialized = true;
        void execute(nextSource);
      }
    });
  } else if (options?.immediate !== false && hydratedValue === undefined) {
    void execute(undefined);
  }

  if (options?.key) {
    const unregisterInvalidation = registerResourceInvalidation(options.key, () => execute(currentSource));
    if (getCurrentEffect() || getCurrentContext()) {
      onCleanup(unregisterInvalidation);
    }
  }

  return {
    data,
    error,
    state,
    loading: () => state() === "pending",
    latest: () => data(),
    promise: () => currentPromise,
    refetch: () => execute(currentSource),
    mutate: (value) => {
      data.set(typeof value === "function" ? (value as (current: TData | undefined) => TData)(data()) : value);
      state.set("ready");
      error.set(undefined);
      Debug.emit("resource:mutate", {
        state: "ready"
      });
    }
  };
}