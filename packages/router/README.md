# @terajs/router

Routing primitives for Terajs applications.

This package provides route matching, navigation state, in-memory history, route prefetching, route data loading contracts, and merged route metadata resolution.

## Install

```bash
npm install @terajs/router
```

## Core APIs

- `createRouter(routes, options?)`
- `createMemoryHistory(initialPath?)`
- `matchRoute(routes, target)`
- `loadRouteMatch(match, options?)`
- `prefetchRouteMatch(match)`
- `prefetchRoute(router, target)`
- `clearPrefetchedRouteMatches()`
- `createRouteHydrationSnapshot(loaded)`
- `resolveLoadedRouteMetadata(loaded)`
- `getRouteDataResourceKey(routeId)`
- `getRouteDataResourceKeys(routeIds)`

Browser history integration lives in `@terajs/renderer-web` and the top-level `@terajs/app` package.

## Minimal Example

```ts
import { createRouter, createMemoryHistory } from "@terajs/router";

const router = createRouter(
  [
    {
      id: "home",
      path: "/",
      filePath: "/routes/index.tera",
      layout: null,
      middleware: [],
      prerender: true,
      hydrate: "eager",
      edge: false,
      meta: {},
      layouts: [],
      component: async () => ({ default: () => document.createTextNode("Home") })
    }
  ],
  { history: createMemoryHistory("/") }
);

await router.start();
```

## Metadata and AI resolution

`resolveLoadedRouteMetadata()` merges route-facing metadata from three places:

- outer-to-inner layout components
- the route definition itself
- the loaded page component module

That merged result includes:

- `meta`
- optional `ai`
- normalized `route` information including layout ids

This is the contract used by head updates, SSR metadata output, and DevTools route/meta/AI inspection.

## Notes

- Route loading and metadata resolution are framework-agnostic contracts.
- Browser-specific behavior belongs in history adapters and renderer packages.
