# @terajs/app

App-facing facade package for Terajs.

Most Terajs applications should start here. `@terajs/app` gives you the default web-first surface in one package while keeping leaf packages available when you need lower-level control.

## Scaffold a new app

```bash
npm create terajs@latest my-app
cd my-app
npm install
npm run dev
```

## Install into an existing Vite app

```bash
npm install @terajs/app vite
```

## What this package includes

`@terajs/app` re-exports the parts of the stack most web applications use together:

- fine-grained reactivity from `@terajs/reactivity`
- runtime primitives from `@terajs/runtime`
- router and route-manifest helpers
- selected web renderer APIs such as `mount`, `createRouteView`, `Link`, `Form`, `SubmitButton`, `FormStatus`, `defineCustomElement`, and `renderIRModuleToFragment`

It also exposes two app-facing subpaths:

- `@terajs/app/vite` for the Vite plugin
- `@terajs/app/devtools` for the DevTools overlay and VS Code bridge lifecycle helpers

If you need structured bridge-session APIs for custom tooling, import `@terajs/devtools` directly instead of widening the app-facing subpath.

## Quickstart

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
	routeDirs: ["src/pages"],
	autoImportDirs: ["src/components"],
	router: {
		rootTarget: "app",
		middlewareDir: "src/middleware",
		applyMeta: true
	}
};
```

```tera
<template>
	<section>
		<h1>{{ heading() }}</h1>
	</section>
</template>

<script>
import { signal } from "@terajs/app";

const heading = signal("Hello from Terajs");
</script>
```

## When to use leaf packages directly

Drop below `@terajs/app` when you are:

- building adapters, renderers, or tooling
- composing a custom runtime surface for a library
- importing only one layer of the stack on purpose

The facade is the default application path, not a replacement for the modular package graph.

## Related packages

- `@terajs/vite-plugin`: the same Vite integration exposed through `@terajs/app/vite`
- `@terajs/devtools`: the lower-level DevTools package, including structured bridge-session APIs beyond the app-facing `@terajs/app/devtools` facade
- `@terajs/adapter-react` and `@terajs/adapter-vue`: host-framework integration seams
- `@terajs/hub-signalr`, `@terajs/hub-socketio`, `@terajs/hub-websockets`: realtime transport adapters
