# Terajs API Reference

This reference describes the **current public surface** used by web-first Terajs apps.

Release scope reflected here:
- `terajs`
- `terajs/vite`
- `terajs/devtools`
- `@terajs/reactivity`
- `@terajs/runtime`
- `@terajs/renderer-web`
- `@terajs/router`
- `@terajs/renderer-ssr`

---

# 0. App Entry Package (`terajs`)

## 0.1 Main facade

The `terajs` package is the default app-facing entrypoint.

It re-exports the main web-first surface from:
- `@terajs/reactivity`
- `@terajs/runtime`
- `@terajs/router`
- selected `@terajs/renderer-web` exports

It also exposes route-manifest helpers:
- `buildRouteManifest(...)`
- `RouteConfigInput`
- `RouteManifestOptions`
- `RouteSourceInput`

## 0.2 Build integration

- `terajs/vite` re-exports the default Terajs Vite plugin.
- `TerajsVitePluginOptions` is available from `terajs/vite`.

## 0.3 Devtools overlay

- `terajs/devtools` re-exports the devtools overlay controls:
  - `mountDevtoolsApp(...)`
  - `mountDevtoolsOverlay(...)`
  - `toggleDevtoolsOverlay()`
  - `toggleDevtoolsVisibility()`
  - `unmountDevtoolsOverlay()`

- `terajs/devtools` also re-exports bridge/session helpers for browser tooling and IDE integrations:
  - `getDevtoolsBridge()`
  - `readDevtoolsBridgeSession(instanceId?)`
  - `waitForDevtoolsBridge(options?)`
  - `subscribeToDevtoolsBridge(listener, options?)`

- Current bridge event exports:
  - `DEVTOOLS_BRIDGE_READY_EVENT`
  - `DEVTOOLS_BRIDGE_UPDATE_EVENT`
  - `DEVTOOLS_BRIDGE_DISPOSE_EVENT`

- Current bridge contract types:
  - `DevtoolsBridgeSnapshot`
  - `DevtoolsBridgeSessionExport`
  - `DevtoolsBridgeEventDetail`
  - `DevtoolsBridgeEventRecord`
  - `DevtoolsBridgeInstanceSummary`
  - `DevtoolsBridgeTabName`
  - `DevtoolsGlobalBridge`
  - `SubscribeToDevtoolsBridgeOptions`
  - `WaitForDevtoolsBridgeOptions`

- The browser global bridge surface is structured and imperative rather than DOM-based:
  - `listInstances()`
  - `getSnapshot(instanceId?)`
  - `exportSession(instanceId?)`
  - `setActiveInstance(instanceId)`
  - `focusTab(tab, instanceId?)`
  - `selectComponent(scope, instance, instanceId?)`
  - `reveal(instanceId?)`

- `DevtoolsBridgeTabName` currently includes:
  - `Components`
  - `AI Diagnostics`
  - `Signals`
  - `Meta`
  - `Issues`
  - `Logs`
  - `Timeline`
  - `Router`
  - `Queue`
  - `Performance`
  - `Sanity Check`
  - `Settings`

- Development-only VS Code bridge helpers are also public from `terajs/devtools`:
  - `autoAttachVsCodeDevtoolsBridge(options?)`
  - `stopAutoAttachVsCodeDevtoolsBridge()`
  - `DevtoolsIdeAutoAttachOptions`
  - `DevtoolsIdeBridgeManifest`

The auto-attach helper is development-only. It discovers the live receiver through the same-origin `/_terajs/devtools/bridge` route and is a no-op in production builds.

The exported session intentionally uses structured runtime state, code references, and allowlisted document-head context instead of scraping arbitrary page DOM.

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

Built-in runtime components include:
- `Portal(props)`
- `Suspense(props)`

## 2.5 Hydration resource helpers

- `setHydrationState(...)`
- `getHydratedResource(key)`
- `consumeHydratedResource(key)`
- `scheduleHydration(mode, mount, element)`

## 2.6 Server function APIs

Runtime exports include:
- `server(...)`
- `executeServerFunction(...)`
- `executeServerFunctionCall(...)`
- `executeServerFunctionCallWithMetadata(...)`
- `setServerFunctionTransport(...)`
- `getServerFunctionTransport()`
- `hasServerFunction(id)`
- `createFetchServerFunctionTransport(...)`
- `createServerContextFromRequest(...)`
- `createServerFunctionRequestHandler(...)`
- `handleServerFunctionRequest(...)`
- `readServerFunctionCall(...)`

Use these for app-owned server boundaries, not as a replacement for your external API contracts.

## 2.7 Local-first foundation APIs

- `createMutationQueue(options?)`
- `createMutationQueueStorage(adapter, key?)`
- `defaultMutationRetryPolicy`
- `MutationConflictResolver` hooks (`replace`, `ignore`, `merge` decisions)
- `createAction(...).runQueued(queueOptions, ...args)`
- `createResource(...).mutate(value, { queue, serverCall, ... })`

These APIs provide queue contracts, retry hooks, and persistence-friendly mutation flows. Advanced conflict resolution remains a planned extension.

## 2.8 Resource invalidation

- `invalidateResources(keys)`
- `registerResourceInvalidation(keys, handler)`

These APIs let runtime resources and route data react to invalidation events without baking environment-specific cache ownership into the core runtime.

## 2.9 Validation

- `createSchemaValidator(schema)`

Associated public types include:
- `ParseSchema`
- `SafeParseSchema`
- `ValidationIssue`
- `ValidationResult`
- `Validator`

## 2.10 Development: hot module replacement

- `applyHMRUpdate(name, nextSetup, nextIR)`
- `registerHMRComponent(handle)`
- `unregisterHMRComponent(name)`

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

- `createBrowserHistory(window?)`
- `createRouteView(router, options?)`
- `Link(props)`
- `RoutePending(props)`
- `useIsNavigating(router?)`
- `usePendingTarget(router?)`

## 3.5 Metadata integration

- `updateHead(meta, ai)`

## 3.6 Forms

- `Form(props)`
- `SubmitButton(props)`
- `FormStatus(props)`
- `formDataToObject(formData)`

## 3.7 Error boundaries

- `withErrorBoundary(component, options)`

## 3.8 Web component interop

- `defineCustomElement(name, component)`

## 3.9 Low-level IR rendering

- `renderIRModuleToFragment(ir, ctx)`

---

# 4. Router (`@terajs/router`)

## 4.1 Core router APIs

- `createRouter(routes, options?)`
- `createMemoryHistory(initialPath?)`
- `matchRoute(routes, target)`

## 4.2 Loading and prefetch

- `loadRouteMatch(match, options?)`
- `prefetchRouteMatch(match)`
- `prefetchRoute(router, target)`
- `clearPrefetchedRouteMatches()`

## 4.3 Route metadata

- `resolveLoadedRouteMetadata(...)`

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