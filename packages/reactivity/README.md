# @terajs/reactivity

Fine-grained reactive primitives for Terajs.

Most application code can import these APIs through `@terajs/app`, but this package is the canonical leaf package for signals, effects, computed values, and DX helpers.

## Core surface

- `signal(initialValue, options?)`: callable reactive accessor with `.set()` and `.update()`
- `state(initialValue)`: explicit `.get()` / `.set()` state container
- `computed(fn, options?)`: lazy derived value with `.get()`
- `effect(fn)`: tracked side effect
- `reactive(object)`, `ref(value)`, `model()`
- DX helpers: `watch()`, `watchEffect()`, `onEffectCleanup()`, `dispose()`, `contract()`
- memo helpers: `memo()`, `markStatic()`, `shallowRef()`
- runtime mode helpers: `isServer()`, `setRuntimeMode()`

## `signal()` vs `state()`

Terajs ships both forms on purpose:

- `signal()` is a callable accessor and is the common app-facing primitive
- `state()` is an explicit getter/setter container used where that shape is clearer or already established

```ts
import { computed, effect, signal, state } from "@terajs/reactivity";

const count = signal(0);
const legacyCount = state(0);
const doubled = computed(() => count() * 2);

effect(() => {
  console.log(count(), legacyCount.get(), doubled.get());
});

count.set(1);
legacyCount.set(1);
```

## Observability and DevTools

The reactivity package is wired into the shared debug core.

- signals register reactive metadata
- computed values register ownership and recomputation events
- effects participate in the dependency graph
- DevTools can inspect graph state and runtime updates without app-specific logging glue

## Notes

- `computed()` currently returns an object with `.get()`, not a callable accessor.
- `signal()` can carry metadata options such as `scope`, `instance`, `key`, and source location for diagnostics.
- For app-level docs, prefer the `@terajs/app` import path unless you are deliberately working at the leaf-package level.

