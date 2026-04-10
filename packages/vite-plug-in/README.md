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
import terajsPlugin from '@terajs/vite-plugin';

export default {
  plugins: [terajsPlugin()]
};
```

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

It scans `src/routes` and `src/pages` for `.tera` files, preserves `<route>` metadata, and attaches any discovered `layout.tera` files as an ordered layout chain.

Supported route conventions:

```txt
src/routes/
  layout.tera
  index.tera
  docs/
    layout.tera
    [slug].tera
```

This produces a manifest that already includes:
- inferred paths like `/docs/:slug`
- file-based layout wrappers from outermost to innermost
- `<route>` overrides for path, middleware, hydration, prerender, and edge hints
- lazy component loaders for each route
- production-ready hashed asset lookup when Vite emits `manifest.json`

### 4. Canonical App Shell

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

### 5. Devtools Overlay

To enable the Terajs DevTools overlay, import and call:

```js
import { mountDevtoolsOverlay } from '@terajs/devtools';
mountDevtoolsOverlay();
```

This will show the overlay in your app for live inspection.

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
- You can extend or override the plugin for custom workflows.

