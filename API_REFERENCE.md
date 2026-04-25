# Terajs API Reference

This reference describes the current shipped public surface for web-first Terajs applications and the public leaf packages they build on.

Release scope reflected here:
- `create-terajs`
- `@terajs/cli`
- `@terajs/app`
- `@terajs/app/vite`
- `@terajs/app/devtools`
- `@terajs/reactivity`
- `@terajs/runtime`
- `@terajs/router`
- `@terajs/router-manifest`
- `@terajs/renderer`
- `@terajs/renderer-web`
- `@terajs/renderer-ssr`
- `@terajs/devtools`
- `@terajs/vite-plugin`
- `@terajs/sfc`
- `@terajs/compiler`
- `@terajs/shared`
- `@terajs/ui`
- `@terajs/adapter-ai`
- `@terajs/adapter-react`
- `@terajs/adapter-vue`
- `@terajs/hub-signalr`
- `@terajs/hub-socketio`
- `@terajs/hub-websockets`

This file is intentionally launch-scoped. Directional renderer work, Kit-level ideas, and future-native plans belong in the roadmap and vision docs.

## Project Creation

- `npm create terajs@latest <name>` is the public scaffold command.
- That command runs the published `create-terajs` generator package.
- The generated starter centers on `@terajs/app`, `@terajs/app/vite`, `terajs.config.cjs`, and the default `src/pages` route tree.

## 0. App Entry Surface (`@terajs/app`)

### 0.1 Main facade

`@terajs/app` is the default app-facing entrypoint.

It re-exports the main web-first surface from:
- `@terajs/reactivity`
- `@terajs/runtime`
- `@terajs/router`
- selected `@terajs/renderer-web` exports

It also re-exports route-manifest helpers:
- `buildRouteManifest(inputs, options?)`
- `RouteConfigInput`
- `RouteManifestOptions`
- `RouteSourceInput`

### 0.2 Build integration

- `@terajs/app/vite` re-exports the default Terajs Vite plugin.
- `TerajsVitePluginOptions` is available from `@terajs/app/vite`.

### 0.3 DevTools app-facing path

`@terajs/app/devtools` re-exports the public DevTools overlay and bridge helpers:

- overlay controls: `mountDevtoolsApp(root, options?)`, `mountDevtoolsOverlay(options?)`, `toggleDevtoolsOverlay()`, `toggleDevtoolsVisibility()`, `unmountDevtoolsOverlay()`
- development-only VS Code bridge helpers: `autoAttachVsCodeDevtoolsBridge(options?)`, `connectVsCodeDevtoolsBridge()`, `disconnectVsCodeDevtoolsBridge()`, `retryVsCodeDevtoolsBridgeConnection()`, `getDevtoolsIdeBridgeStatus()`, `stopAutoAttachVsCodeDevtoolsBridge()`, `DEVTOOLS_IDE_BRIDGE_STATUS_CHANGE_EVENT`, `DevtoolsIdeAutoAttachOptions`, `DevtoolsIdeBridgeManifest`, `DevtoolsIdeBridgeMode`, `DevtoolsIdeBridgeStatus`

With the stock overlay defaults, DevTools mounts open in development, `Alt+Shift+D` toggles the panel, and `Alt+Shift+H` hides or restores the full shell. Apps can override those defaults through `devtools.startOpen`, `devtools.panelShortcut`, and `devtools.visibilityShortcut`.

For structured bridge-session APIs such as `getDevtoolsBridge()`, `readDevtoolsBridgeSession(instanceId?)`, `waitForDevtoolsBridge(options?)`, `subscribeToDevtoolsBridge(listener, options?)`, and the related bridge event/types surface, import `@terajs/devtools` directly.

At the leaf-package level, the browser global bridge surface is structured and imperative rather than DOM-based:

- `listInstances()`
- `getSnapshot(instanceId?)`
- `exportSession(instanceId?)`
- `setActiveInstance(instanceId)`
- `focusTab(tab, instanceId?)`
- `selectComponent(scope, instance, instanceId?)`
- `reveal(instanceId?)`

`DevtoolsBridgeTabName` currently includes:

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

The VS Code auto-attach helper is development-only. It polls the same-origin `/_terajs/devtools/bridge` route, which mirrors the extension's workspace cache manifest at `node_modules/.cache/terajs/devtools-bridge.json` when available and falls back to the extension's user-local receiver manifest for apps outside the current workspace, and is a no-op in production builds.

Receiver discovery and live-session streaming are now separate steps. The default overlay uses an explicit connect or retry action once a receiver is available, and custom shells can drive the same lifecycle through `connectVsCodeDevtoolsBridge()`, `retryVsCodeDevtoolsBridgeConnection()`, and `disconnectVsCodeDevtoolsBridge()`. Production app builds do not emit the bridge manifest route or DevTools bootstrap wiring.

## 1. SFC and Route Metadata Contracts

### 1.1 `.tera` block model

The shipped SFC block model supports:

- `<template>`
- `<script>`
- `<style>`
- `<meta>`
- `<ai>`
- `<route>`

`<ai>` is part of the shipped surface. It is parsed as instructional metadata only and is not executable code.

### 1.2 `parseSFC(source, filePath)` (`@terajs/sfc`)

`parseSFC()` returns a `ParsedSFC` with these fields:

- `filePath`
- `template`
- `script`
- `style`
- `meta`
- optional `ai`
- `routeOverride`

### 1.3 `<meta>` / `MetaConfig`

`MetaConfig` is the typed metadata contract carried through SFC parsing, route definitions, client metadata updates, and SSR.

Common fields include:

- `title`
- `description`
- `keywords`
- `aiSummary`
- `aiKeywords`
- `aiAltText`
- `schema`
- `analytics`
- `performance`
- `a11y`
- `i18n`

### 1.4 `<route>` / `RouteOverride`

`RouteOverride` is the typed route override contract parsed from `<route>` blocks.

Supported override fields are:

- `path`
- `layout`
- `mountTarget`
- `middleware`
- `prerender`
- `hydrate`
- `edge`

### 1.5 `<ai>`

The `<ai>` block is carried as an opaque object. Today that means:

- SFC parsing preserves it on `ParsedSFC.ai`
- route-manifest generation carries it onto `RouteDefinition.ai`
- route metadata resolution merges it across layouts, route definitions, and page component carriers
- DevTools can inspect it as structured runtime metadata

### 1.6 Route-manifest helpers

`buildRouteManifest(inputs, options?)` builds route definitions from `.tera` sources and route config overrides.

It is responsible for:

- file-based path inference
- attaching ordered layout chains
- preserving `<route>` overrides
- carrying `meta` and `ai` from the parsed SFC into the route definition

## 2. Reactivity (`@terajs/reactivity`)

### 2.1 `signal(initialValue, options?)`

Creates a callable signal accessor with mutation helpers.

```ts
const count = signal(0);
count();
count.set(1);
count.update((value) => value + 1);
```

Signals also register reactive metadata used by diagnostics and DevTools.

### 2.2 `state(initialValue)`

Creates a state container with explicit `get()` / `set()` accessors.

```ts
const count = state(0);
count.get();
count.set(1);
```

### 2.3 `computed(fn, options?)`

Creates a lazy, memoized derived value.

```ts
const doubled = computed(() => count() * 2);
doubled.get();
```

### 2.4 `effect(fn)`

Runs `fn` reactively and returns a `ReactiveEffect` handle.

```ts
const handle = effect(() => {
  console.log(count());
});
```

### 2.5 DX and utility exports

- cleanup and disposal: `onEffectCleanup(fn)`, `dispose(effectHandle)`
- watch layer: `watch(source, callback)`, `watchEffect(fn)`
- additional primitives: `ref()`, `reactive()`, `model()`
- memo helpers: `memo()`, `markStatic()`, `shallowRef()`
- runtime mode helpers: `isServer()`, `setRuntimeMode()`
- DX contract helper: `contract()`

## 3. Runtime (`@terajs/runtime`)

### 3.1 Component wrapper

Use `component(options, setup)` to define Terajs components.

```ts
const App = component({ name: "App" }, () => () => {
  return document.createTextNode("hello");
});
```

`component()` can carry `meta`, `ai`, and `route` on the component wrapper for routing, metadata resolution, and tooling.

### 3.2 Lifecycle and cleanup

- `onCleanup(fn)`
- `onMounted(fn)`
- `onUpdated(fn)`
- `onUnmounted(fn)`

### 3.3 Context / dependency injection

Current context APIs are explicit and low-level:

- `createComponentContext()`
- `getCurrentContext()`
- `setCurrentContext(ctx)`
- `provide(key, value)`
- `inject(key, fallback?)`

Built-in runtime components include `Portal(props)` and `Suspense(props)`.

### 3.4 Async data and local-first runtime

- `createAction(handler, options?)`
- `createResource(fetcher, options?)`
- `createResource(source, fetcher, options?)`
- `invalidateResources(keys)`
- `registerResourceInvalidation(keys, handler)`
- `createMutationQueue(options?)`
- `createMutationQueueStorage(adapter, key?)`
- `defaultMutationRetryPolicy`
- `MutationConflictResolver` hooks (`replace`, `ignore`, `merge`)

These are shipped local-first runtime primitives, not app-specific conventions.

### 3.5 Hydration helpers

- `setHydrationState()`
- `getHydratedResource(key)`
- `consumeHydratedResource(key)`
- `scheduleHydration(mode, mount, element)`

### 3.6 Validation

- `createSchemaValidator(schema)`

Associated public types include:

- `ParseSchema`
- `SafeParseSchema`
- `ValidationIssue`
- `ValidationResult`
- `Validator`

### 3.7 Server-function APIs

- `server()`
- `executeServerFunction()`
- `executeServerFunctionCall()`
- `executeServerFunctionCallWithMetadata()`
- `setServerFunctionTransport()`
- `getServerFunctionTransport()`
- `hasServerFunction(id)`
- `createFetchServerFunctionTransport()`
- `createServerContextFromRequest()`
- `createServerFunctionRequestHandler()`
- `handleServerFunctionRequest()`
- `readServerFunctionCall()`

The common app-facing wrapper shape is `server(handler, options?)`.

Use these for app-owned server boundaries. They do not replace external API design.

### 3.8 Development / HMR

- `applyHMRUpdate(name, nextSetup, nextIR)`
- `registerHMRComponent(handle)`
- `unregisterHMRComponent(name)`

## 4. Web Renderer (`@terajs/renderer-web`)

### 4.1 Mounting and hydration

- `mount(component, root, props?)`
- `unmount(root)`
- `hydrateRoot(component, root, props?)`
- `readHydrationPayload()`

Hydration uses in-place reconciliation when SSR DOM shape matches and falls back to replacement when it does not.

### 4.2 JSX / template primitives

- JSX runtime exports: `jsx`, `jsxs`, `Fragment`
- control-flow exports: `Switch`, `Match`, `Show`, `For`
- portal primitive: `Portal()`

### 4.3 Route-aware web primitives

- `createBrowserHistory(window?)`
- `createRouteView(router, options?)`
- `Link(props)`
- `RoutePending(props)`
- `useIsNavigating(router?)`
- `usePendingTarget(router?)`

### 4.4 Metadata integration

- `updateHead(meta, ai)`

This is where resolved route `meta` and `ai` can feed browser head updates and diagnostics.

### 4.5 Forms and helpers

- `Form(props)`
- `SubmitButton(props)`
- `FormStatus(props)`
- `formDataToObject(formData)`

### 4.6 Error boundaries and custom elements

- `withErrorBoundary(component, options)`
- `defineCustomElement(name, component)`

### 4.7 Low-level IR rendering

- `renderIRModuleToFragment(ir, ctx)`

## 5. Router (`@terajs/router`)

### 5.1 Core router APIs

- `createRouter(routes, options?)`
- `createMemoryHistory(initialPath?)`
- `matchRoute(routes, target)`

### 5.2 Loading and prefetch

- `loadRouteMatch(match, options?)`
- `prefetchRouteMatch(match)`
- `prefetchRoute(router, target)`
- `clearPrefetchedRouteMatches()`
- `createRouteHydrationSnapshot(loaded)`

### 5.3 Route metadata resolution

- `resolveLoadedRouteMetadata(loaded)`

`resolveLoadedRouteMetadata()` merges `meta`, `ai`, and route carrier data from:

- ordered layouts
- the route definition
- the page component module

It returns:

- `meta`
- optional `ai`
- normalized `route` information including layout ids

### 5.4 Route data resource keys

- `getRouteDataResourceKey(routeId)`
- `getRouteDataResourceKeys(routeIds)`
- `ROUTE_DATA_RESOURCE_KEY`

## 6. SSR (`@terajs/renderer-ssr`)

### 6.1 String rendering

- `renderToString(component, context?)`

### 6.2 Streaming rendering

- `renderToStream(component, context?)`

### 6.3 Route execution helpers

- `executeServerRoute(options)`

### 6.4 SSR types

- `SSRContext`
- `SSRHydrationHint`
- `SSRResult`
- `ExecuteServerRouteOptions`
- `ExecuteServerRouteResult`
- `SSRRouteModule`

`SSRContext` and `SSRResult` both carry `meta`, `route`, optional `ai`, serialized resources, and route hydration state.

## 7. Tooling and Leaf Packages

### 7.1 `@terajs/devtools`

The leaf-package entrypoint for the same DevTools surface exposed through `@terajs/app/devtools`, including the explicit VS Code bridge lifecycle helpers and status types documented in section `0.3`.

### 7.2 `@terajs/vite-plugin`

The leaf-package entrypoint for:

- `.tera` compilation
- `virtual:terajs-auto-imports`
- `virtual:terajs-routes`
- `virtual:terajs-app`
- route/layout/middleware discovery
- dev-only tooling hooks and hub wiring

### 7.3 `@terajs/sfc`

Public exports include:

- `parseSFC()`
- `compileTemplate()`
- `compileScript()`
- SFC types and structured SFC errors

### 7.4 `@terajs/compiler`

Public exports include:

- `parseTemplateToAst()`
- `templateTokenizer`
- IR generator/types exports
- `rewriteScopedCss()`
- `compileStyle()`
- compiler-side SFC types

### 7.5 `@terajs/shared`

Shared exports include:

- debug event APIs: `Debug`, `subscribeDebug()`, `emitDebug()`, `readDebugHistory()`
- dependency graph APIs: `addDependency()`, `removeDependencyNode()`, `getDependencyGraphSnapshot()`, `getDependencyNode()`
- `DevtoolsBridge` read-only graph helpers
- metadata and registry types
- `MetaConfig` and `RouteOverride`

### 7.6 `@terajs/router-manifest`

Public exports include:

- `inferPathFromFile(filePath)`
- `buildRouteFromSFC(parsedSfc)`
- `buildRouteManifest(inputs, options?)`
- `RouteConfigInput`
- `RouteManifestOptions`
- `RouteSourceInput`

Use this package when you need direct route-manifest assembly outside the default Vite-plugin path.

### 7.7 `@terajs/renderer`

This is the neutral renderer-contract package used by current and future renderer implementations.

Public exports include:

- AST node types such as `ASTNode`, `ElementNode`, `TextNode`, `InterpolationNode`, `IfNode`, and `ForNode`
- renderer contracts such as `RenderContext` and `Renderer`
- template and component contracts such as `TemplateFn` and `FrameworkComponent`
- mount and hydration contracts such as `MountAPI`, `MountOptions`, `HydrationAPI`, and `HydrationMode`
- renderer error types such as `RendererError` and `UnsupportedNodeError`

### 7.8 `@terajs/ui`

`@terajs/ui` is a public but intentionally minimal package at this release.

Its current role is to reserve the shared UI seam while runtime and renderer contracts stabilize. It does not currently replace `@terajs/renderer-web` for web primitives or `@terajs/devtools` for development overlays.

### 7.9 `@terajs/adapter-ai`

Public exports include:

- `defineAIActions(schema)`
- `captureStateSnapshot(signals?)`
- `createAIChatbot(options)`
- `AIActionsSchema`
- `AIActionsDefinition`
- `AIStateSnapshot`

`captureStateSnapshot()` emits a sanitized reactive-state snapshot intended for tooling and assistant-style integrations. Sensitive keys are filtered rather than blindly serialized.

`createAIChatbot()` provides a higher-level chatbot request client for apps. It defaults to same-origin endpoints, blocks absolute external endpoints unless `allowExternalEndpoint: true` is set, omits ambient credentials when external transport is explicitly enabled, and only includes state snapshots when the caller explicitly provides signals and opts in with `includeStateSnapshot: true`.

### 7.10 React and Vue adapters

- `@terajs/adapter-react`: `TerajsWrapper`, `useTerajsResource()`
- `@terajs/adapter-vue`: `TerajsDirective`, `mountTerajs()`, `useTerajsResource()`, `injectTerajsResource()`

### 7.11 First-party hub adapters

- `@terajs/hub-signalr`: `createSignalRHubTransport()`
- `@terajs/hub-socketio`: `createSocketIoHubTransport()`
- `@terajs/hub-websockets`: `createWebSocketHubTransport()`

All three implement the runtime `ServerFunctionTransport` contract and expose connect/disconnect/subscription semantics plus `hub:*` diagnostics.

## 8. Stable vs Directional Boundary

This reference intentionally documents shipped web-first APIs.

Still directional or intentionally outside this file:

- native renderer implementation details
- animation / transition frameworks
- broader Kit-level conventions beyond current exports

## 9. Summary

Terajs keeps the shipped surface explicit:

- fine-grained reactivity
- compiler-native rendering paths
- route-first application structure
- local-first runtime seams
- structured metadata and AI context
- modular packages with boundary-aware adapters