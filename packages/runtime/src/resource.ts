import { effect, getCurrentEffect, signal, type Signal } from "@terajs/reactivity";
import { Debug } from "@terajs/shared";
import { onCleanup } from "./component/component.js";
import { getCurrentContext } from "./component/context.js";
import { consumeHydratedResource } from "./hydration.js";
import { registerResourceInvalidation, type ResourceKey } from "./invalidation.js";
import { localStorageAdapter } from "./persistence/adapters.js";
import type { MutationQueue } from "./queue/mutationQueue.js";

export interface ResourcePayload<T = any> {
  data?: T;
  error?: any;
  status: "pending" | "success" | "error";
}

export type ResourceState = "idle" | "pending" | "ready" | "error";
function isResourcePayload(value: unknown): value is ResourcePayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    ((value as any).status === "pending" ||
      (value as any).status === "success" ||
      (value as any).status === "error")
  );
}

function getHydratedData<TValue = unknown>(key: string): TValue | ResourcePayload<TValue> | undefined {
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
  source: () => "hydration" | "persistence" | "network" | undefined;
  promise: () => Promise<TData> | null;
  refetch: () => Promise<TData>;
  mutate: (value: TData | ((current: TData | undefined) => TData), options?: ResourceMutateOptions) => void;
}

export interface ResourceMutateOptions {
  queue?: MutationQueue;
  queueType?: string;
  queuePayload?: unknown;
  maxRetries?: number;
  shouldQueue?: (error: unknown) => boolean;
  serverCall?: (payload: unknown) => Promise<unknown> | unknown;
}

type ResourceFetcher<TSource, TData> = (source: TSource) => Promise<TData> | TData;

interface ResourceOptions<TData> {
  initialValue?: TData;
  immediate?: boolean;
  hydrateKey?: string;
  key?: ResourceKey | ResourceKey[];
  persistent?: string;
  ssr?: boolean;
}

/**
 * Creates a resource without a reactive source.
 *
 * The fetcher executes immediately by default, unless `options.immediate` is `false`.
 */
export function createResource<TData>(
  fetcher: () => Promise<TData> | TData,
  options?: ResourceOptions<TData>
): Resource<TData>;

/**
 * Creates a resource driven by a reactive source accessor.
 *
 * When the source value changes, the resource re-fetches using the new source.
 */
export function createResource<TSource, TData>(
  source: () => TSource,
  fetcher: ResourceFetcher<TSource, TData>,
  options?: ResourceOptions<TData>
): Resource<TData>;

/**
 * Creates a resource with reactive data, lifecycle state, and optional
 * hydration/persistence/invalidation integration.
 *
 * @typeParam TSource Source input type when using source-driven resources.
 * @typeParam TData Resource payload type.
 * @param sourceOrFetcher Source accessor or fetcher function.
 * @param maybeFetcher Fetcher when source accessor is provided, otherwise options.
 * @param maybeOptions Optional resource configuration.
 * @returns Reactive resource API for loading, refetching, and local mutation.
 */
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
  const persistentKey = options?.persistent;
  const hydrationKey = options?.hydrateKey ?? (options?.ssr ? persistentKey : undefined) ?? (typeof options?.key === "string" ? options.key : undefined);
  const hydratedValue = hydrationKey
    ? consumeHydratedResource<TData>(hydrationKey) ?? getHydratedData<TData>(hydrationKey)
    : undefined;

  const payload = isResourcePayload(hydratedValue) ? hydratedValue : undefined;
  const initialValue = payload?.status === "success" ? payload.data : (payload ? undefined : (hydratedValue as TData | undefined ?? options?.initialValue));
  const initialError = payload?.status === "error" ? payload.error : undefined;
  const initialState = payload
    ? payload.status === "pending"
      ? "pending"
      : payload.status === "error"
      ? "error"
      : "ready"
    : initialValue !== undefined
      ? "ready"
      : "idle";

  const data = signal<TData | undefined>(initialValue);
  const error = signal<unknown>(initialError);
  const state = signal<ResourceState>(initialState);
  const sourceSignal = signal<"hydration" | "persistence" | "network" | undefined>(
    hydratedValue !== undefined ? "hydration" : undefined
  );

  if (persistentKey && hydratedValue === undefined && typeof window !== "undefined") {
    void localStorageAdapter.getItem<TData>(persistentKey)
      .then((cached) => {
        if (cached !== null && cached !== undefined) {
          data.set(cached);
          sourceSignal.set("persistence");
          if (state() === "idle") {
            state.set("ready");
          }
        }
      })
      .catch(() => undefined);
  }

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
      sourceSignal.set("network");
      state.set("ready");
      error.set(undefined);
      if (persistentKey && typeof window !== "undefined") {
        void Promise.resolve()
          .then(() => localStorageAdapter.setItem(persistentKey, resolved))
          .catch(() => undefined);
      }
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
    source: () => sourceSignal(),
    promise: () => currentPromise,
    refetch: () => execute(currentSource),
    mutate: (value, options) => {
      const nextValue = typeof value === "function"
        ? (value as (current: TData | undefined) => TData)(data())
        : value;

      data.set(nextValue);
      state.set("ready");
      error.set(undefined);

      if (persistentKey && typeof window !== "undefined") {
        void Promise.resolve()
          .then(() => localStorageAdapter.setItem(persistentKey, nextValue))
          .catch(() => undefined);
      }

      const serverCall = options?.serverCall;
      if (serverCall) {
        const queuePayload = options?.queuePayload ?? nextValue;

        void Promise.resolve()
          .then(() => serverCall(queuePayload))
          .catch(async (mutationError) => {
            if (options?.shouldQueue && !options.shouldQueue(mutationError)) {
              return;
            }

            if (!options?.queue) {
              Debug.emit("resource:error", {
                source: persistentKey,
                error: mutationError instanceof Error ? mutationError.message : mutationError
              });
              return;
            }

            const queueType = options.queueType
              ?? (persistentKey ? `resource:${persistentKey}` : "resource:mutation");

            options.queue.register(queueType, (payload) => serverCall(payload));

            await options.queue.enqueue({
              type: queueType,
              payload: queuePayload,
              maxRetries: options.maxRetries
            });
          });
      }

      Debug.emit("resource:mutate", {
        state: "ready"
      });
    }
  };
}