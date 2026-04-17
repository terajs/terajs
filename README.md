# **Terajs**

Terajs is a UI framework built on **fine-grained reactivity**, a **compiler-powered template system**, and a **developer-first philosophy**.
It focuses on predictable updates, direct DOM rendering, and modular package boundaries.

Terajs is:

- **TypeScript-first, but TypeScript-optional**
- **style-agnostic**
- **platform-agnostic**
- **DX-driven**
- **debuggable by design**
- **AI-ready and meta-aware**

Terajs's goal is simple:

> **Provide structure without restricting creativity.**

---

# Features

## **Fine-grained reactivity**
Terajs uses explicit, dependency-tracked signals:

- `signal()` for reactive values
- `computed()` for derived values
- `effect()` for side effects
- deterministic updates
- no VDOM
- no diffing
- no component re-renders

Signals update the DOM directly.

---

## **Single-File Components (SFC)**

Terajs components use a clean, declarative format:

```
<template>
<script>
<style>
<meta>
<ai>      <- supported metadata block
<route>
```

Everything a component needs lives in one place.

---

## **Auto-imports & DevTools**

- All `.tera` files in `src/components` (or configured dirs) are globally available in SFCs - no manual imports needed.
- DevTools overlay: live inspection of components, signals, effects, logs, issues, performance, and sanity checks.
- In development, DevTools is available by default as a floating FAB overlay with keyboard toggles.
- In development, DevTools can also mirror a sanitized live session into the companion VS Code tooling through a same-origin bridge. Production builds do not expose that bridge.

## **Single entry + leaf packages**

Terajs supports two complementary usage modes:

- **Default app path:** install `terajs` and use `terajs/vite` in your Vite config.
- **Advanced path:** import leaf packages directly under `@terajs/*` when you need tighter control.

This keeps first-time setup simple while preserving modular architecture boundaries.

### Example: Using auto-imported components

Suppose you have:

```
src/components/FancyButton.tera
```

You can use `<FancyButton />` in any SFC without importing it.

### DevTools defaults and overrides

By default, DevTools is enabled in development and starts collapsed as a FAB in the bottom-center corner.
Generated starter apps intentionally pin `devtools.enabled: false` in `terajs.config.cjs` so each app opts in explicitly; remove that override to use the development default.
You can override this in `terajs.config.cjs`:

```js
module.exports = {
  devtools: {
    enabled: true,
    startOpen: false,
    position: "bottom-center",
    panelShortcut: "Ctrl+Shift+D",
    visibilityShortcut: "Ctrl+Shift+H"
  }
};
```

### VS Code live attach in development

Terajs DevTools exposes a development-only VS Code pairing path built around structured session export and a same-origin manifest route, not DOM scraping.

- The companion VS Code extension writes localhost receiver metadata into `node_modules/.cache/terajs/devtools-bridge.json` for Terajs workspace roots.
- The Vite plugin mirrors that metadata through the same-origin `/_terajs/devtools/bridge` route during development, and `autoAttachVsCodeDevtoolsBridge()` polls that route with `no-store` caching.
- When a manifest is present, the browser streams `bridge.exportSession()` payloads to the extension's localhost receiver, installs the attached VS Code AI bridge, and enables `Open VS Code Live Session` and `Ask VS Code AI` in the overlay.
- The exported session includes structured snapshots, recent event records, code references, and allowlisted document-head context.
- Production builds do not install the auto-attach helper or serve the bridge manifest route.

```ts
import {
  autoAttachVsCodeDevtoolsBridge,
  mountDevtoolsOverlay
} from "terajs/devtools";

mountDevtoolsOverlay();
autoAttachVsCodeDevtoolsBridge();
```

When the companion VS Code tooling is available, the DevTools overlay can:

- open the mirrored live session in VS Code
- send the current sanitized debugging bundle to VS Code AI
- copy the same debugging prompt for manual pairing

### Customizing auto-imports

Add a `terajs.config.js` to your project root:

```js
module.exports = {
  autoImportDirs: [
    'src/components',
    'packages/devtools/src/components',
  ]
};
```

---

## **Compiler-powered templates**

Terajs includes a full template pipeline:

- tokenizer
- parser
- AST transforms
- IR generation
- optimized codegen
- SSR-aware output
- hydration hints

Templates compile into direct DOM operations bound to signals.

---

## **Component-driven routing & metadata**

Terajs components can define:

- route configuration
- SEO metadata
- AI metadata
- layouts
- nested routes

Routing is flexible, not prescriptive.

---

## **SSR support**

Terajs's SSR model:

- components run once
- effects do not run on the server
- deterministic hydration
- no hydration mismatch traps
- hydration logs for debugging

Streaming SSR is supported through `@terajs/renderer-ssr`.

For applications that need server-owned logic, Terajs can also expose an optional app server boundary for route loaders and server functions.

That boundary is meant for:

- database access
- auth and session checks
- cookie-aware personalization
- trusted mutations
- secret-bearing backend calls

It is not meant to replace direct API clients or formal service contracts. If your app already talks to a versioned backend through OpenAPI, Kiota, REST, or GraphQL, that remains a valid client boundary.

Terajs's role is the app-layer boundary between the UI and server-owned logic, not a replacement for external API design.

---

## **Current web app primitives**

The web stack now has the main pieces needed for a real site build:

- route loading with `createRouteView(...)`
- route-shell loading states with `keepPreviousDuringLoading` and `pending`
- router-aware links with prefetch and pending state via `Link(...)`
- enhanced forms via `Form(...)`
- mutation helpers via `SubmitButton(...)` and `FormStatus(...)`
- route data revalidation via keyed invalidation

### Example: Web route shell + enhanced form

```ts
import { createRouter, createMemoryHistory, getRouteDataResourceKey } from "@terajs/router";
import { invalidateResources } from "@terajs/runtime";
import {
  createRouteView,
  Form,
  FormStatus,
  Link,
  SubmitButton
} from "@terajs/renderer-web";

let profileName = "Ada";

const router = createRouter([
  {
    id: "home",
    path: "/",
    filePath: "/pages/index.tera",
    layout: null,
    middleware: [],
    prerender: true,
    hydrate: "eager",
    edge: false,
    meta: {},
    layouts: [],
    component: async () => ({
      default: () => Link({ to: "/settings", children: "Settings" })
    })
  },
  {
    id: "settings",
    path: "/settings",
    filePath: "/pages/settings.tera",
    layout: null,
    middleware: [],
    prerender: true,
    hydrate: "eager",
    edge: false,
    meta: { title: "Settings" },
    layouts: [],
    component: async () => ({
      default: ({ data }) => Form({
        action: async ({ values }) => {
          profileName = String(values.name);
          await invalidateResources(getRouteDataResourceKey("settings"));
          return "saved";
        },
        children: [
          document.createTextNode(`Profile: ${data.name}`),
          Object.assign(document.createElement("input"), { name: "name", value: data.name }),
          SubmitButton({ children: "Save" }),
          FormStatus({ idle: "idle", pending: "saving" })
        ]
      }),
      load: async () => ({ name: profileName })
    })
  }
], {
  history: createMemoryHistory("/")
});

const App = createRouteView(router, {
  loading: ({ match }) => document.createTextNode(`loading:${match.fullPath}`),
  pending: ({ match }) => document.createTextNode(`shell:${match.fullPath}`),
  keepPreviousDuringLoading: true
});
```

This is the current center of gravity for Terajs on the web: route-driven loading, trusted mutations, and reactive UI primitives without bringing in a VDOM layer.

### Local-first foundation (current)

The current release includes a local-first baseline:

- resource persistence via `createResource(..., { persistent: key })`
- mutation queue contracts via `createMutationQueue(...)`
- queue-aware action execution via `createAction(...).runQueued(...)`
- queue-aware enhanced forms via `Form({ queue, ... })`

This is a foundation layer. Advanced sync conflict strategies and multi-device merge policies are still planned.

### Realtime sync hub status (RC)

- First-party adapters are available for `signalr`, `socket.io`, and `websockets`.
- All adapters share the same runtime transport contract and emit `hub:*` events for devtools.
- Custom transports remain supported through `setServerFunctionTransport(...)` when apps need bespoke protocols.

---

## **Style-agnostic**

Terajs does not enforce or prefer any styling approach.

Use:

- Tailwind
- UnoCSS
- CSS Modules
- SCSS
- Styled Components
- Vanilla CSS
- Inline styles
- Design systems

Scoped styles are optional and require no build step.

---

## **Platform-agnostic**

Terajs Core is renderer-agnostic.

Planned renderers:

- **packages/renderer-web** - DOM
- **packages/renderer-ios** and **packages/renderer-android** - native renderers
- **packages/renderer-canvas** - Canvas/WebGL/Skia
- **packages/renderer-ssr** - server output
- **packages/renderer-terminal** - terminal UIs

Write once, render anywhere.

---

## **Developer experience**

Terajs is built for humans:

- predictable reactivity
- simple mental model
- readable stack traces
- clear error messages
- fast HMR
- template -> IR -> DOM mapping
- devtools hooks and overlay tooling

Debugging is a first-class feature.

---

# Example Component

```tera
<template>
  <button class="root" @click="increment">
    Count: {{ count }}
  </button>
</template>

<script>
  export let initial = 0

  const count = signal(initial)

  function increment() {
    count.set(count() + 1)
  }
</script>

<style scoped>
  .root {
    padding: 8px;
  }
</style>

<meta>
{
  "title": "Counter",
  "description": "A simple counter component",
  "keywords": ["counter", "example", "terajs"],
  "og:title": "Terajs Counter Example",
  "og:description": "A minimal counter component built with Terajs"
}
</meta>

<ai>
{
  "summary": "A simple interactive counter component that demonstrates Terajs's fine-grained reactivity.",
  "intent": "Demonstrate reactive UI updates",
  "entities": ["counter", "button", "signal"],
  "audience": "developers learning Terajs"
}
</ai>

<route>
{
  "path": "/counter",
  "layout": "default"
}
</route>
```

> **Note:**
> The `<ai>` block is parsed and available in the metadata pipeline.
> Advanced AI tooling on top of that metadata remains an evolving area.

---

# Monorepo Structure

```
packages/
  terajs/          -> single app-facing entry package
  compiler/        -> template compiler (AST -> IR -> codegen)
  reactivity/      -> fine-grained reactive system
  renderer/        -> platform-agnostic renderer core
  renderer-web/    -> DOM renderer + JSX runtime
  renderer-ssr/    -> server renderer
  runtime/         -> hydration, scheduling, lifecycle
  router/          -> component-driven routing
  sfc/             -> .tera single-file component parser
  shared/          -> shared utilities
  ui/              -> optional UI primitives
```

Terajs Core stays minimal.
The `terajs` package provides convention-first defaults while leaf packages stay available for advanced use.

---

# Roadmap (Short Version)

- [x] Fine-grained reactivity
- [x] JSX runtime
- [x] IR renderer
- [x] SSR renderer
- [x] Hydration
- [x] Routing
- [x] Metadata system
- [x] Template compiler
- [x] **AI metadata block (`<ai>`)**
- [x] Streaming SSR
- [ ] Virtualized lists
- [x] Portal primitives
- [x] Devtools
- [ ] Terajs Kit (meta-framework)
- [ ] Native renderer
- [ ] Canvas renderer

Full roadmap is in `ROADMAP.md`.

---

# Philosophy Summary

Terajs aims to be:

- simple
- fast
- predictable
- flexible
- platform-agnostic
- scalable from small apps to enterprise systems
- TypeScript-first, but JS-friendly
- debuggable by design

Terajs gives developers **power, not rules**.

---
