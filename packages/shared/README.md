# @terajs/shared

Neutral shared contracts for Terajs debugging, graph inspection, metadata, route types, hydration helpers, and component context plumbing.

This is a core package. Most app code should not depend on it directly unless you are building tooling, diagnostics, or framework-level integrations.

## Core areas

- debug events: `Debug`, `subscribeDebug()`, `emitDebug()`, `readDebugHistory()`, `clearDebugHistory()`
- metadata helpers: `createReactiveMetadata()` and related debug/registry types
- dependency graph: `addDependency()`, `removeDependencyNode()`, `getDependencyNode()`, `getDependencyGraphSnapshot()`
- DevTools graph bridge: `DevtoolsBridge.getGraph()`, `getNode()`, `getDependencies()`, `getDependents()`, `traceUpdate()`
- shared route and metadata types: `MetaConfig`, `RouteOverride`
- shared component-context and hydration types

## Debug event example

```ts
import { Debug } from "@terajs/shared";

Debug.emit("hub:connect", {
  transport: "signalr",
  url: "https://api.example.com/live"
});
```

## Dependency graph example

```ts
import { addDependency, getDependencyGraphSnapshot } from "@terajs/shared";

addDependency("Counter#1.effect#1", "Counter#1.ref#1");
const graph = getDependencyGraphSnapshot();
```

## Notes

- DevTools should use the exported `DevtoolsBridge` instead of reaching into internal graph files.
- `MetaConfig` and `RouteOverride` are the shared contracts behind `<meta>` and `<route>` parsing.
- The runtime, reactivity, router, and tooling layers all depend on this package to stay aligned on diagnostics and shared types.

