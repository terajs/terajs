# Terajs Component System

This guide explains the component model and authoring patterns. For exact signatures and canonical exported symbols, use `API_REFERENCE.md`.

Terajs components are the unit where rendering, routing, metadata, and runtime behavior meet. They are not just paint functions.

For the shipped web-first surface, there are two primary authored styles:

- `.tera` single-file components for templates, route pages, layouts, metadata, and route-local behavior
- TSX/JSX components for explicit programmatic composition on top of the same runtime and renderer contracts

## 1. Start with `.tera` for route-facing work

Most Terajs apps should begin with `.tera` components because the format keeps the route-facing surface cohesive.

```tera
<template>
  <section>
    <h1>{{ title() }}</h1>
    <p>{{ summary() }}</p>
  </section>
</template>

<script>
import { signal } from "@terajs/app";

const title = signal("Counter workspace");
const summary = signal("A small page with explicit state and metadata.");
</script>

<meta>
  title: Counter workspace
  description: Small Terajs component example.
</meta>

<route>
  path: /examples/counter-workspace

</route>

<ai>
  summary: Intro component example for Terajs docs
  audience: developers
  keywords: components, sfc, metadata
</ai>
```

Structured blocks are part of the shipped component surface:

- `<template>`: declarative markup compiled to IR
- `<script>`: component logic and imports
- `<style>`: component styling
- `<meta>`: route and document metadata
- `<ai>`: structured AI and tooling context
- `<route>`: route configuration overrides

## 2. TSX/JSX remains available for explicit composition

Terajs also supports function components built on the same runtime.

```tsx
import { component, signal } from "@terajs/app";

export const Counter = component(
  { name: "Counter" },
  ({ initialCount = 0 }: { initialCount?: number }) => {
    const count = signal(initialCount);

    return () => (
      <button onClick={() => count.set(count() + 1)}>
        Count: {count()}
      </button>
    );
  }
);
```

The file extension is not the important part. The runtime model is:

- components execute once
- reactive reads drive targeted updates
- renderer work happens at the binding level instead of through a VDOM rerender loop

## 3. Components can carry application meaning

Terajs components are more than reusable view fragments.

Depending on the authored style, a component can carry:

- local state and lifecycle
- template or render behavior
- route configuration
- document metadata
- AI and diagnostics context that tooling can inspect
- layout participation in the route tree

That is why route pages, layouts, and feature components all fit into the same component model.

## 4. Reactivity is explicit

Terajs components are built on explicit reactive primitives.

- `signal()` for callable reactive values
- `state()` for explicit getter/setter state
- `computed()` for derived values
- `effect()` for side effects
- `onCleanup()` and lifecycle hooks for mount/unmount behavior

Example:

```ts
import { computed, signal } from "@terajs/app";

const count = signal(1);
const doubled = computed(() => count() * 2);
```

This keeps dependencies visible and makes it easier for the runtime and DevTools to explain what updated and why.

## 5. Lifecycle and cleanup

Lifecycle hooks live in the runtime layer, not in adapter-specific wrappers.

```ts
import { effect, onCleanup, onMounted } from "@terajs/app";

onMounted(() => {
  console.log("mounted");
});

effect(() => {
  const timer = setInterval(() => console.log("tick"), 1000);
  onCleanup(() => clearInterval(timer));
});
```

Effects do not run on the server, and cleanup stays part of the same runtime contract across authored component styles.

## 6. Route pages and layouts are still components

The route system is component-driven.

- page files are components
- `layout.tera` files are components
- route metadata is component-adjacent
- route loading follows component and route boundaries

The shipped surface supports route and module-level async loading, but a standalone public `lazy()` helper is not part of the current API.

## 7. Metadata and AI are part of the component model

Terajs components can carry structured `meta`, `ai`, and `route` data.

That enables:

- document head updates during route transitions
- AI-friendly semantic hints close to the component that owns them
- DevTools inspection of route, metadata, and AI context
- SSR metadata and route state reuse without scraping arbitrary DOM

The `<ai>` block is parsed as instructional metadata only. It is not executable code.

## 8. Composition stays direct

Composition does not require framework ceremony.

For `.tera` SFCs, configured component directories are auto-imported so route files can stay small.

```text
src/components/FancyButton.tera
```

Once `src/components` is configured in `autoImportDirs`, you can use `<FancyButton />` directly inside another SFC.

For TSX/JSX or explicit module composition, normal imports still work.

## 9. Interop is real, but it stays at the seams

Terajs ships first-party React and Vue wrappers because mixed stacks are real.

- `@terajs/adapter-react` mounts Terajs components inside React trees through `TerajsWrapper`
- `@terajs/adapter-vue` mounts Terajs components inside Vue through `TerajsDirective` and `mountTerajs`

Those wrappers are integration seams, not the center of the component model. Terajs core does not adopt React or Vue as its internal mental model.

## 10. Web Components are supported too

For browser-native composition, `@terajs/app` also exposes `defineCustomElement()` through the web renderer surface.

That makes it possible to ship Terajs components across framework boundaries without forcing React-specific or Vue-specific wrapper usage.

## 11. SSR and hydration behavior

The same component model works on server and client with the usual SSR constraints:

- effects do not run on the server
- hydration expects matching markup and can emit diagnostics when server and client diverge
- route components, layouts, and feature components all sit on top of the same runtime contracts

The goal is consistency, not separate component models per environment.

## 12. Keep files small and responsibility-owned

Terajs is strongest when route files and components stay tight.

- keep routes focused on route-specific behavior
- move shared content or configuration into local modules
- use wrappers and adapters only where an integration boundary actually exists
- avoid turning one route or one component into the entire application model

That keeps the compiler, runtime, route tree, and DevTools easier to reason about.

## 13. Summary

Terajs components are:

- renderer-aware without being renderer-bound
- route-capable without needing a separate component model
- metadata-aware without leaking tooling concerns into app code
- explicit in their reactivity and lifecycle behavior
- compatible with mixed stacks through adapters at the seams

That combination is what makes the Terajs component model different from a generic view-function story.
