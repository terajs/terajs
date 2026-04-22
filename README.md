# Terajs

Terajs is a compiler-native UI framework for route-first, local-first web applications.

It combines fine-grained reactivity, direct DOM bindings from compiler output, a renderer-agnostic core, and first-party diagnostics. The web-first launch surface centers on `@terajs/app`, while lower-level packages remain public for teams that want tighter control over the stack.

For exact API signatures and exported symbols, see `API_REFERENCE.md`. For longer-range direction, see `VISION.md` and the roadmap documents.

## Why Terajs

Terajs is strongest where these pieces reinforce each other:

- **Compiler-native rendering:** templates compile to IR and bind directly to DOM updates. No VDOM diff loop.
- **Route-first application model:** `.tera` pages, layout chains, route metadata, and middleware are assembled through the Vite pipeline instead of scattered through app glue.
- **Local-first runtime primitives:** actions, resources, invalidation, mutation queues, retry policy, and conflict handling live in the runtime rather than in ad hoc app utilities.
- **Transport choice without forking your app model:** first-party SignalR, Socket.IO, and WebSockets adapters all plug into the same server-function transport contract.
- **Integrated diagnostics:** DevTools can inspect components, router activity, queue health, performance, and structured AI/debug context, with an optional live bridge into the companion VS Code tooling.
- **Framework-agnostic core:** neutral packages stay neutral, while React and Vue wrappers exist as integration seams rather than as design centers.

## Performance claims and benchmarks

Terajs is designed around compiler-produced DOM bindings and fine-grained reactive updates, but that is not a blanket claim that every Terajs workload beats every React or Vue workload.

This repo now includes a reproducible local comparison harness:

```bash
npm run bench:frameworks
```

The current benchmark compares production builds of Terajs, Vue 3, and React 18 on the same jsdom workload:

- 1,000 rendered rows
- 200 targeted single-row updates
- 20 full-list updates
- 5 warmup runs and 25 timed runs per scenario

On the local verification run used for this README update, Terajs was fastest in the targeted-update scenario, slower than React and Vue on initial mount, and slower than React on the bulk full-list update scenario. Treat those numbers as workload-specific microbenchmarks, not a universal application ranking.

## Start with a scaffold

For most apps, start with the official project generator.

```bash
npm create terajs@latest my-app
cd my-app
npm install
npm run dev
```

That command generates the route-first starter surface around:

- `@terajs/app`
- `@terajs/app/vite`
- `terajs.config.cjs`
- `src/pages` route scaffolding
- `src/components` auto-import scaffolding

### Recommended VS Code tooling

If you use VS Code, install the official Terajs extension for `.tera` language support and the DevTools bridge workflow:

- Marketplace: [Terajs - Tera Language Tools](https://marketplace.visualstudio.com/items?itemName=Terajs.terajs-tera-language-tools)
- Extensions search: search for `Terajs official`

The extension provides `.tera` syntax support, metadata diagnostics, hover and completion support, and the companion inspection surface for the DevTools bridge described later in this README.

### Manual setup in an existing Vite app

If you are integrating Terajs into an existing Vite app instead of generating a starter, use the app-facing facade package directly.

```bash
npm install @terajs/app vite
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import terajsPlugin from "@terajs/app/vite";

export default defineConfig({
  plugins: [terajsPlugin()]
});
```

```js
// terajs.config.cjs
module.exports = {
  autoImportDirs: ["src/components"],
  routeDirs: ["src/pages"],
  router: {
    rootTarget: "app",
    middlewareDir: "src/middleware",
    applyMeta: true,
    keepPreviousDuringLoading: true
  }
};
```

```tera
<template>
  <section>
    <h1>{{ title() }}</h1>
    <p>{{ summary() }}</p>
  </section>
</template>

<script>
import { signal } from "@terajs/app";

const title = signal("Hello Terajs");
const summary = signal("Route-first apps with compiler-native rendering.");
</script>

<meta>
  title: Hello Terajs
  description: First page for a Terajs app.
</meta>

<ai>
  summary: Home page for the Terajs launch example
  audience: developers
  keywords: terajs, docs, local-first, devtools
</ai>

<route>
  path: /
</route>
```

If `index.html` contains `#app` and no module entry script, the plugin can auto-bootstrap the app through `virtual:terajs-app`. The same build surface also exposes `virtual:terajs-auto-imports` and `virtual:terajs-routes` for route-aware application assembly.

## Examples

These examples cover common entry points.

### 1. A TSX/JSX component on the same runtime

```tsx
import { component, signal } from "@terajs/app";

export const Counter = component(
  { name: "Counter" },
  ({ initialCount = 0 }: { initialCount?: number }) => {
    const count = signal(initialCount);

    return () => (
      <button onClick={() => count.set(count() + 1)}>
        Count: {count()}
      </button>
    );
  }
);
```

### 2. A queue-aware local-first action

```ts
import { createAction, createMutationQueue } from "@terajs/app";

const queue = await createMutationQueue();

const saveProfile = createAction(async (payload: { name: string }) => {
  return payload.name;
});

await saveProfile.runQueued(
  {
    queue,
    type: "profile:save",
    conflictKey: "current-user"
  },
  { name: "Ada" }
);
```

### 3. A realtime transport wired into invalidation

```ts
import { invalidateResources, setServerFunctionTransport } from "@terajs/app";
import { createSocketIoHubTransport } from "@terajs/hub-socketio";

const hub = await createSocketIoHubTransport({
  url: "https://api.example.com/live",
  autoConnect: true,
  retryPolicy: "exponential"
});

hub.subscribe((message) => {
  if (message.type === "invalidate") {
    void invalidateResources(message.keys);
  }
});

setServerFunctionTransport(hub);
```

### 4. A browser-native custom element

```tsx
import { component, defineCustomElement, signal } from "@terajs/app";

const CounterBadge = component({ name: "CounterBadge" }, () => {
  const count = signal(0);

  return () => (
    <button onClick={() => count.set(count() + 1)}>
      Badge count: {count()}
    </button>
  );
});

defineCustomElement("counter-badge", CounterBadge);
```

## Full shipped release surface

### 1. App entry and build integration

The release starts with three app-facing paths:

- `@terajs/app`: the main web-first facade
- `@terajs/app/vite`: the default Vite integration
- `@terajs/app/devtools`: the app-facing DevTools and bridge path

The build layer currently ships:

- `.tera` compilation
- route, layout, and middleware discovery
- component auto-import directory support
- virtual modules for auto imports, routes, and app bootstrap
- auto-bootstrap when an app uses `#app` without a separate module entry script
- direct route-manifest helpers through `@terajs/router-manifest` when you need that layer explicitly

### 2. Component authoring and route files

Terajs supports both authored component styles that exist in the repo today:

- `.tera` single-file components for route-facing work
- TSX/JSX components for explicit programmatic composition

The shipped `.tera` block model includes:

- `<template>`
- `<script>`
- `<style>`
- `<meta>`
- `<ai>`
- `<route>`

Those blocks are real runtime and tooling inputs, not documentation-only ideas. `meta`, `ai`, and `route` are preserved through parsing, route-manifest generation, metadata resolution, SSR, and DevTools inspection.

### 3. Reactivity and runtime contracts

The app-facing surface includes fine-grained reactivity and runtime primitives for real application work:

- `signal(...)`, `state(...)`, `computed(...)`, `effect(...)`, `watch(...)`, and related helpers
- `component(...)` for Terajs-native components
- lifecycle hooks such as `onMounted(...)`, `onUpdated(...)`, `onUnmounted(...)`, and `onCleanup(...)`
- context and dependency injection through `provide(...)` and `inject(...)`
- async data and mutation primitives through `createResource(...)`, `createAction(...)`, and invalidation helpers
- durable mutation queues and retry/conflict handling through `createMutationQueue(...)`, queue storage, and `MutationConflictResolver`
- validation through `createSchemaValidator(...)`
- server-function transport contracts and helpers for app-owned server boundaries

### 4. Routing, metadata, and browser primitives

The route layer is part of the runtime story, not bolted on beside it.

- file-based routes and ordered layout chains
- middleware discovery through the configured middleware directory
- metadata resolution that merges `meta`, `ai`, and route carrier data from layouts, route definitions, and page modules
- browser-aware route helpers such as `createBrowserHistory(...)`, `createRouteView(...)`, `Link(...)`, `RoutePending(...)`, and pending-state hooks
- forms and submit helpers through `Form(...)`, `SubmitButton(...)`, `FormStatus(...)`, and `formDataToObject(...)`
- error boundaries and browser-native custom elements through `withErrorBoundary(...)` and `defineCustomElement(...)`

### 5. SSR, hydration, and server functions

The shipped web-first surface includes both client and server paths:

- `@terajs/renderer-ssr` for string and stream rendering
- route execution helpers for SSR route modules
- hydration helpers in runtime plus `hydrateRoot(...)` in the web renderer
- server-function helpers such as `server(...)`, `executeServerFunction(...)`, request handlers, and fetch-based or custom transports

SSR results carry route state, metadata, optional AI context, and serialized resource data so client hydration and diagnostics can reuse structured state instead of reconstructing it from DOM guesses.

### 6. Local-first runtime and realtime transport

Local-first behavior is a shipped framework concern in Terajs, not an app-specific add-on.

- actions, resources, invalidation, and durable mutation queues are part of the runtime
- retries, queue lifecycle, and conflict-resolution decisions are structured rather than ad hoc
- queued mutation lifecycle and hub transport events feed directly into DevTools diagnostics

The current first-party realtime adapters are:

- `@terajs/hub-signalr`
- `@terajs/hub-socketio`
- `@terajs/hub-websockets`

All three plug into the same runtime `ServerFunctionTransport` contract. The public scaffold command can preconfigure hub-ready apps with `npm create terajs@latest my-app -- --hub <signalr|socket.io|websockets> [--hub-url <url>]`.

Example realtime config:

```js
module.exports = {
  sync: {
    hub: {
      type: "socket.io",
      url: "https://api.example.com/live",
      autoConnect: true,
      retryPolicy: "exponential"
    }
  }
};
```

### 7. DevTools and the VS Code bridge

Terajs DevTools is part of the shipped app surface.

For the VS Code side of that workflow, install the official companion extension: [Terajs - Tera Language Tools](https://marketplace.visualstudio.com/items?itemName=Terajs.terajs-tera-language-tools). In the Extensions view, you can also find it by searching for `Terajs official`.

The overlay can inspect:

- mounted components and drill-down state
- signals and effect activity
- issues and logs
- router transitions and load timing
- queue lifecycle metrics
- performance summaries
- AI diagnostics context assembled from structured runtime data
- live bridge sessions for the companion VS Code tooling

When DevTools is enabled, the in-page overlay mounts open by default during development so the first local run immediately shows runtime state. `Alt+Shift+D` toggles the panel, and `Alt+Shift+H` hides or restores the full floating shell.

In development, you can also discover the companion VS Code receiver through a same-origin bridge and then connect from the page when you are ready to stream the sanitized live session.

```ts
import {
  autoAttachVsCodeDevtoolsBridge,
  mountDevtoolsOverlay
} from "@terajs/app/devtools";

mountDevtoolsOverlay();
autoAttachVsCodeDevtoolsBridge();
```

`autoAttachVsCodeDevtoolsBridge()` enables receiver discovery. In the stock overlay, AI Diagnostics exposes `Connect VS Code Bridge` when a receiver is available. Custom shells can drive the same explicit lifecycle with `connectVsCodeDevtoolsBridge()`, `retryVsCodeDevtoolsBridgeConnection()`, and `disconnectVsCodeDevtoolsBridge()`.

Once connected, the companion extension can inspect the same sanitized snapshot directly through `Terajs: Inspect Attached Site`, the attached-site status bar entry, or the sticky `@terajs` chat participant. The mirrored live panel is still available, but it is no longer required for the direct AI workflow.

That bridge is development-only. Production app builds do not emit the bridge manifest route, the auto-attach wiring, or the DevTools bootstrap path.

### 8. Interop and lower-level public packages

Terajs exposes a wider public package graph than the three app-facing entrypoints.

- `@terajs/adapter-react`: mount Terajs components inside React trees and bridge Terajs resources into React hooks
- `@terajs/adapter-vue`: mount Terajs components inside Vue applications and bridge resources into Vue composables and directives
- `@terajs/adapter-ai`: define structured AI action schemas, capture sanitized reactive state snapshots, and wire app chatbots with same-origin-safe defaults
- `@terajs/renderer`: platform-agnostic renderer interfaces, AST contracts, mount/hydration interfaces, and renderer errors
- `@terajs/router-manifest`: infer file paths, build routes from parsed SFCs, and assemble route manifests directly
- `@terajs/compiler`: template parsing, AST, IR, and style compilation primitives
- `@terajs/sfc`: `.tera` parser and compiler helpers
- `@terajs/shared`: shared metadata, debug-event, and dependency-graph contracts
- `@terajs/devtools`: the same DevTools surface exposed through `@terajs/app/devtools`
- `@terajs/vite-plugin`: the same Vite integration exposed through `@terajs/app/vite`
- `@terajs/ui`: a public but intentionally minimal shared-UI seam reserved for future stable framework UI primitives

### 9. Directional work already in the repo

Some Terajs work is present in-repo today but is not part of the shipped web-first launch center:

- `packages/renderer-ios`: experimental stub work for SwiftUI-backed native rendering
- `packages/renderer-android`: experimental stub work for Compose-backed native rendering
- `ROADMAP_NATIVE_RENDERERS.md`, `RENDERER_ARCHITECHTURE.md`, and `terajs_kit.md`: directional docs for where the framework can expand after the web-first release surface

Those areas are important, but this README keeps them clearly separated from the current release surface.

## Framework-agnostic core, not compatibility theater

Terajs is framework-agnostic at the architecture level, not just in slogans.

- Core packages such as `shared`, `reactivity`, `runtime`, `compiler`, `router`, and `sfc` stay neutral.
- Environment-specific behavior lives in adapters and renderers such as `renderer-web`, `renderer-ssr`, and the Vite plugin.
- React and Vue wrappers exist to let Terajs participate in mixed stacks without making React or Vue the center of the core design.

That is why the project can ship wrappers like `@terajs/adapter-react` and `@terajs/adapter-vue` while still keeping the main runtime model Terajs-native.

## Package map

The current repo is easiest to understand in four groups.

### App-facing and launch-centered

- `@terajs/app`
- `@terajs/app/vite`
- `@terajs/app/devtools`
- `@terajs/reactivity`
- `@terajs/runtime`
- `@terajs/router`
- `@terajs/renderer-web`
- `@terajs/renderer-ssr`

### Lower-level public packages

- `@terajs/renderer`
- `@terajs/router-manifest`
- `@terajs/compiler`
- `@terajs/sfc`
- `@terajs/shared`
- `@terajs/devtools`
- `@terajs/vite-plugin`
- `@terajs/adapter-ai`
- `@terajs/adapter-react`
- `@terajs/adapter-vue`
- `@terajs/hub-signalr`
- `@terajs/hub-socketio`
- `@terajs/hub-websockets`
- `@terajs/ui`

### Scaffold and CLI tools

- `create-terajs`: the npm `create` wrapper for one-command project scaffolding
- `@terajs/cli`: the tooling package behind scaffold generation and project maintenance commands

### Directional repo work

- `packages/renderer-ios`
- `packages/renderer-android`

## Related docs

- `API_REFERENCE.md`: current public API surface
- `COMPONENTS.md`: component model and authoring patterns
- `Core_Philosophy.md`: architecture principles and package boundaries
- `CHANGELOG.md`: shipped release changes
- `RELEASE_CANDIDATE_CHECKLIST.md`: RC status and release gates
- `STYLE_GUIDE.md`: authoring conventions
- `VISION.md`: long-range product direction
- `ROADMAP.md`: broader roadmap
- `ROADMAP_NATIVE_RENDERERS.md`: native renderer direction
- `RENDERER_ARCHITECHTURE.md`: renderer-contract and renderer-design notes
- `terajs_kit.md`: Kit-level direction
- `BRAND_GUIDELINES.md`, `BRAND_TOKENS.md`, `TRADEMARKS.md`, `LICENSE.md`: brand and legal documents
- package READMEs under `packages/*`: leaf-package guidance for direct package consumers

---
