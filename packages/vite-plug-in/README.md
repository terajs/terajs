# Nebula Vite Plugin

This plugin enables Nebula SFC compilation, HMR, and auto-imports for your project.

## Features
- Compiles `.nbl` Single-File Components
- Hot Module Replacement (HMR) for SFCs
- **Auto-imports**: All components in configured directories are available globally in SFCs (no manual imports needed)

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

By default, all `.nbl` files in `packages/devtools/src/components` are auto-imported and available in your SFCs.

#### Example
Suppose you have:

```
packages/devtools/src/components/FancyButton.nbl
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

It scans `src/routes` and `src/pages` for `.nbl` files, preserves `<route>` metadata, and attaches any discovered `layout.nbl` files as an ordered layout chain.

Supported route conventions:

```txt
src/routes/
  layout.nbl
  index.nbl
  docs/
    layout.nbl
    [slug].nbl
```

This produces a manifest that already includes:
- inferred paths like `/docs/:slug`
- file-based layout wrappers from outermost to innermost
- `<route>` overrides for path, middleware, hydration, prerender, and edge hints
- lazy component loaders for each route

### 4. Devtools Overlay

To enable the Nebula DevTools overlay, import and call:

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

