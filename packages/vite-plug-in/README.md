# @terajs/vite-plugin

Vite integration for Terajs SFC compilation, route manifest generation, auto-bootstrap, and development-time tooling hooks.

Most applications can import the same plugin through `@terajs/app/vite`. Use `@terajs/vite-plugin` directly when you want leaf-package control.

## Install

```bash
npm install @terajs/vite-plugin vite
```

## Core responsibilities

- compile `.tera` single-file components
- generate `virtual:terajs-auto-imports`
- generate `virtual:terajs-routes`
- generate `virtual:terajs-app` for config-driven bootstrap
- discover pages, layouts, middleware, and route metadata
- support no-main bootstrap flows when `index.html` does not provide a module entry
- expose development-time hooks for DevTools live attach
- auto-wire first-party realtime adapters from `sync.hub`

## Basic usage

```ts
import { defineConfig } from "vite";
import terajsPlugin from "@terajs/vite-plugin";

export default defineConfig({
  plugins: [terajsPlugin()]
});
```

```js
module.exports = {
  routeDirs: ["src/pages"],
  autoImportDirs: ["src/components"],
  router: {
    rootTarget: "app",
    middlewareDir: "src/middleware",
    keepPreviousDuringLoading: true,
    applyMeta: true
  }
};
```

For shared-source multi-target workspaces, add an explicit `workspace` block instead of treating the default web-first scaffold as already agnostic.

```js
module.exports = {
  workspace: {
    mode: "universal",
    sourceRoot: "src/shared",
    targets: {
      selected: ["web", "android", "ios"],
      web: {
        outputDir: "dist"
      },
      android: {
        generatedDir: ".terajs/generated/android",
        hostDir: ".terajs/hosts/android"
      },
      ios: {
        generatedDir: ".terajs/generated/ios",
        hostDir: ".terajs/hosts/ios"
      }
    }
  },
  routeDirs: ["src/shared/pages"],
  autoImportDirs: ["src/shared/components"],
  router: {
    rootTarget: "app",
    middlewareDir: "src/middleware",
    keepPreviousDuringLoading: true,
    applyMeta: true
  }
};
```

Universal mode requires an explicit `workspace.targets.selected` array. Invalid target names, blank generated or host directories, and shared-source directory overrides that drift from `workspace.sourceRoot` fail early during config loading.

## File-based routes

The plugin scans `routeDirs` for `.tera` pages and exposes the result through `virtual:terajs-routes`.

```ts
import routes from "virtual:terajs-routes";
```

The generated manifest includes:

- inferred file-based paths such as `/docs/:slug`
- ordered `layout.tera` chains from outermost to innermost
- preserved `<route>` overrides
- lazy component loaders
- production asset resolution when Vite emits `manifest.json`

Route priority resolves in this order:

1. `<route>` block inside the component
2. explicit route overrides in `terajs.config.cjs`
3. inferred path from the page file location

## Auto-bootstrap

If `index.html` has no module entry script, the plugin can generate and inject the Terajs app bootstrap automatically through `virtual:terajs-app`.

```ts
import { bootstrapTerajsApp } from "virtual:terajs-app";

bootstrapTerajsApp();
```

That virtual module is built from your discovered routes plus router config.

## Middleware discovery

Middleware files under `router.middlewareDir` are registered automatically.

- `src/middleware/auth.ts` becomes `auth`
- `src/middleware/admin/audit.ts` becomes `admin/audit`
- `*.global.ts` files are prepended as global middleware

## Realtime transport wiring

You can opt into realtime hub support through `sync.hub`.

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

First-party adapters currently supported by the plugin:

- `signalr`
- `socket.io`
- `websockets`

Install the matching adapter package for the selected transport.

## Notes

- `virtual:terajs-auto-imports`, `virtual:terajs-routes`, and `virtual:terajs-app` are the main virtual modules exposed by the plugin.
- Custom transports remain possible through the runtime server-function transport contract.
- App-facing docs should usually reference `@terajs/app/vite` first.

