# Terajs Vite Plugin

This plugin enables Terajs SFC compilation, HMR, and auto-imports for your project.

## Features
- Compiles `.tera` Single-File Components
- Hot Module Replacement (HMR) for SFCs
- **Auto-imports**: All components in configured directories are available globally in SFCs (no manual imports needed)
- Production route manifest support with hashed asset resolution from Vite `manifest.json`

## Usage

### 1. Install and configure in your Vite project

```js
// vite.config.js or vite.config.ts
import terajsPlugin from 'terajs/vite';

export default {
  plugins: [terajsPlugin()]
};
```

If you prefer leaf-node packages, you can still import from `@terajs/vite-plugin` directly.

### 2. Auto-imports

By default, all `.tera` files in `packages/devtools/src/components` are auto-imported and available in your SFCs.

#### Example
Suppose you have:

```
packages/devtools/src/components/FancyButton.tera
```

You can use `<FancyButton />` in any SFC without importing it.

#### Customizing auto-import directories

Create a `terajs.config.js` in your project root:

```js
module.exports = {
  autoImportDirs: [
    'packages/devtools/src/components',
    'src/components', // add your own
  ]
};
```

### 3. File-based routes

The plugin also exposes a virtual route manifest module:

```ts
import routes from 'virtual:terajs-routes';
```

It scans `src/pages` for `.tera` files by default (or your configured `routeDirs`), preserves `<route>` metadata, and attaches any discovered `layout.tera` files as an ordered layout chain.

Route priority order:

1. `<route>` block inside the component
2. `routes` overrides in `terajs.config.cjs`
3. inferred path from the page file location

Supported route conventions:

```txt
src/pages/
  layout.tera
  index.tera
  docs/
    layout.tera
    [slug].tera
```

This produces a manifest that already includes:
- inferred paths like `/docs/:slug`
- file-based layout wrappers from outermost to innermost
- `<route>` overrides for path, mountTarget, middleware, hydration, prerender, and edge hints
- lazy component loaders for each route
- production-ready hashed asset lookup when Vite emits `manifest.json`

### 4. Zero-config app bootstrap

For the easiest app entry, you can skip creating `src/main.ts`.
If `index.html` has no module script entry, the plugin auto-injects app bootstrap and mounts to `#app`.

You can still bootstrap manually when desired:

```ts
import { bootstrapTerajsApp } from "virtual:terajs-app";

bootstrapTerajsApp();
```

The plugin builds this app module from:

- `virtual:terajs-routes`
- router defaults in `terajs.config.cjs`

```js
module.exports = {
  routeDirs: ["src/pages"],
  router: {
    rootTarget: "app",
    middlewareDir: "src/middleware",
    keepPreviousDuringLoading: true,
    applyMeta: true
  }
};
```

Middleware files in `router.middlewareDir` are auto-registered:

- `src/middleware/auth.ts` -> middleware key `auth`
- `src/middleware/admin/audit.ts` -> middleware key `admin/audit`
- `src/middleware/telemetry.global.ts` -> global middleware key `telemetry` (prepended to all routes)

When route navigation resolves a `mountTarget` (from route config or `<route>` block), the app view mounts into that target id. If the target element is missing, Terajs auto-creates it.

### 5. Realtime sync hub

You can enable realtime server push and transport-backed server actions through `sync.hub`.

```js
module.exports = {
  sync: {
    hub: {
      type: "signalr",
      url: "https://api.myapp.com/chat-hub",
      autoConnect: true,
      retryPolicy: "exponential"
    }
  }
};
```

Install the adapter(s) for your selected `sync.hub.type`:

```bash
npm install @terajs/hub-signalr @microsoft/signalr
npm install @terajs/hub-socketio socket.io-client
npm install @terajs/hub-websockets
```

RC status:

- `signalr`: implemented and auto-wired by the plugin when `sync.hub.type` is `signalr`.
- `socket.io`: implemented and auto-wired by the plugin when `sync.hub.type` is `socket.io`.
- `websockets`: implemented and auto-wired by the plugin when `sync.hub.type` is `websockets`.

Custom adapters are still supported. Implement `ServerFunctionTransport` (`invoke(call)`) and emit `hub:*` debug events so DevTools can show realtime health and diagnostics.

### 6. Canonical App Shell

Terajs apps can mount a single opinionated shell around the route graph.

```html
<template>
  <div class="terajs-app">
    <RouterView />

    <Portal target="#terajs-modals" />
  </div>
</template>

<script>
  import { routes } from 'virtual:terajs-routes';
  import { createRouter } from '@terajs/router';

  export const router = createRouter(routes);
</script>

<style>
  #terajs-modals {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
  }
</style>
```

This shell keeps the route graph, nested layouts, and portal layer aligned across dev and production.

### 7. Devtools Overlay

In development, Terajs DevTools is available by default and mounts as a floating FAB overlay.
Default interactions:

- `Ctrl+Shift+D`: open/close the DevTools panel
- `Ctrl+Shift+H`: hide/show the overlay shell

You can customize behavior in `terajs.config.cjs`:

```js
module.exports = {
  devtools: {
    enabled: true,
    startOpen: false,
    position: "bottom-center", // bottom-left | bottom-right | bottom-center
    panelShortcut: "Ctrl+Shift+D",
    visibilityShortcut: "Ctrl+Shift+H",
    ai: {
      enabled: true,
      endpoint: "", // optional HTTP endpoint for assistant responses
      model: "terajs-assistant",
      timeoutMs: 12000
    }
  }
};
```

When no `devtools.ai.endpoint` is set, DevTools still generates prompt context and can use a global assistant hook (`window.__TERAJS_AI_ASSISTANT__`) if present.

---

## Testing

Run Vitest tests:

```
npx vitest run
```

---

## Advanced
- The plugin injects `virtual:terajs-auto-imports` for auto-imports.
- The plugin injects `virtual:terajs-routes` for file-based route manifests.
- The plugin injects `virtual:terajs-app` for config-driven app bootstrapping.
- You can extend or override the plugin for custom workflows.

