# Terajs API Reference

This reference describes the **current public surface** used by web-first Terajs apps.

Release scope reflected here:
- `@terajs/reactivity`
- `@terajs/runtime`
- `@terajs/renderer-web`
- `@terajs/router`
- `@terajs/renderer-ssr`

---

# 1. Reactivity (`@terajs/reactivity`)

## 1.1 `signal(initialValue)`

Creates a callable signal accessor with mutation helpers.

```ts
const count = signal(0);
count();           // 0
count.set(1);      // update
count.update((n) => n + 1);
```

## 1.2 `state(initialValue)`

Creates a state container with explicit `get()` / `set()`.

```ts
const count = state(0);
count.get();
count.set(1);
```

## 1.3 `computed(fn)`

Creates a lazy, memoized derived value.

```ts
const doubled = computed(() => count.get() * 2);
doubled.get();
```

## 1.4 `effect(fn)`

Runs `fn` reactively and returns a `ReactiveEffect` handle.

```ts
const stopTarget = effect(() => {
  console.log(count());
});
```

## 1.5 Effect utilities

- `onEffectCleanup(fn)` registers cleanup for the current running effect.
- `dispose(effectHandle)` disposes a reactive effect.
- `watch(source, callback)` and `watchEffect(fn)` are available from the DX layer.

## 1.6 Other exports

- `ref(...)`
- `reactive(...)`
- `model(...)`
- `memo(...)`, `markStatic(...)`, `shallowRef(...)`
- `isServer()`, `setRuntimeMode(...)`

---

# 2. Runtime (`@terajs/runtime`)

## 2.1 Component wrapper

Use `component(options, setup)` to define Terajs components.

```ts
const App = component({ name: "App" }, () => () => {
  return document.createTextNode("hello");
});
```

## 2.2 Component cleanup

`onCleanup(fn)` registers disposers owned by the active component/effect context.

## 2.3 Lifecycle hooks

Current lifecycle hook names:
- `onMounted(fn)`
- `onUpdated(fn)`
- `onUnmounted(fn)`

## 2.4 Context / dependency injection

Current context APIs are low-level and explicit:
- `provide(key, value)`
- `inject(key, fallback?)`

There is no `<Context.Provider>` component API in the runtime package today.

## 2.5 Hydration resource helpers

- `setHydrationState(...)`
- `getHydratedResource(key)`
- `consumeHydratedResource(key)`
- `scheduleHydration(mode, mount, element)`

## 2.6 Server function APIs

Runtime exports include:
- `server(...)`
- `executeServerFunction(...)`
- `createFetchServerFunctionTransport(...)`
- `createServerFunctionRequestHandler(...)`

Use these for app-owned server boundaries, not as a replacement for your external API contracts.

## 2.7 Local-first foundation APIs

- `createMutationQueue(options?)`
- `createMutationQueueStorage(adapter, key?)`
- `defaultMutationRetryPolicy`
- `MutationConflictResolver` hooks (`replace`, `ignore`, `merge` decisions)
- `createAction(...).runQueued(queueOptions, ...args)`
- `createResource(...).mutate(value, { queue, serverCall, ... })`

These APIs provide queue contracts, retry hooks, and persistence-friendly mutation flows. Advanced conflict resolution remains a planned extension.

---

# 3. Web Renderer (`@terajs/renderer-web`)

## 3.1 Mounting

- `mount(component, root, props?)`
- `unmount(root)`

## 3.2 Hydration

- `hydrateRoot(component, root, props?)`
- `readHydrationPayload()`

Hydration uses in-place reconciliation when SSR DOM shape matches and falls back to replacement when it does not.

## 3.3 JSX / template primitives

- JSX runtime exports (`jsx`, `jsxs`, `Fragment`)
- control-flow exports (`Switch`, `Match`, `Show`, `For`)
- `Portal(...)`

## 3.4 Router-aware web primitives

- `createRouteView(router, options?)`
- `Link(props)`

## 3.5 Forms

- `Form(props)`
- `SubmitButton(props)`
- `FormStatus(props)`

---

# 4. Router (`@terajs/router`)

## 4.1 Core router APIs

- `createRouter(routes, options?)`
- `createMemoryHistory(initialPath?)`
- `createBrowserHistory(window?)`
- `matchRoute(routes, target)`

## 4.2 Loading and prefetch

- `loadRouteMatch(match, options?)`
- `prefetchRouteMatch(match)`
- `prefetchRoute(router, target)`
- `clearPrefetchedRouteMatches()`

## 4.3 Route metadata

- `resolveLoadedRouteMetadata(...)`
- `updateHead(meta, ai)`

---

# 5. SSR (`@terajs/renderer-ssr`)

## 5.1 String rendering

- `renderToString(component, options?)`

## 5.2 Streaming rendering

- `renderToStream(component, options?)`

## 5.3 Route execution helpers

- `executeServerRoute(routeModule, options?)`

---

# 6. Notes on Stable vs Deferred

This API reference intentionally describes shipped web-first APIs.

Deferred/non-goal for this release cycle:
- native renderer implementation details
- transitions/animation framework
- expanded app-framework layer guarantees beyond current exports

---

# 7. Philosophy Summary

Terajs keeps the runtime small and explicit:
- fine-grained reactivity
- deterministic updates
- direct rendering paths
- modular packages with clear boundaries