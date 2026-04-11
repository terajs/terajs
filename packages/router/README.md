# @terajs/router

Routing primitives for Terajs applications.

This package provides route matching, navigation state, history adapters, route prefetching, and route data loading contracts.

## Install

```bash
npm install @terajs/router
```

## Core APIs

- `createRouter(routes, options)`
- `createMemoryHistory(initialPath)`
- `createBrowserHistory(window)`
- `matchRoute(routes, target)`
- `loadRouteMatch(match, options)`
- `prefetchRoute(router, target)`
- `createRouteHydrationSnapshot(loaded)`

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

## Notes

- Route loading and metadata resolution are framework-agnostic contracts.
- Browser-specific behavior belongs in history adapters and renderer packages.
