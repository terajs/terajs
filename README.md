# **Nebula**

Nebula is a next‑generation UI framework built on **fine‑grained reactivity**, a **compiler‑powered template system**, and a **developer‑first philosophy**.  
It feels familiar, performs like Solid, reads like Vue, stays flexible like React — without their complexity.

Nebula is:

- **TypeScript‑first, but TypeScript‑optional**  
- **style‑agnostic**  
- **platform‑agnostic**  
- **DX‑driven**  
- **debuggable by design**  
- **AI‑ready and meta‑aware**  

Nebula’s goal is simple:

> **Provide structure without restricting creativity.**

---

# 🚀 Features

## **Fine‑grained reactivity**
Nebula uses explicit, dependency‑tracked signals:

- `signal()` for reactive values  
- `computed()` for derived values  
- `effect()` for side effects  
- deterministic updates  
- no VDOM  
- no diffing  
- no component re‑renders  

Signals update the DOM directly.

---

## **Single‑File Components (SFC)**

Nebula components use a clean, declarative format:

```
<template>
<script>
<style>
<meta>
<ai>      ← planned feature
<route>
```

Everything a component needs lives in one place.

---

## **Compiler‑powered templates**

Nebula includes a full template pipeline:

- tokenizer  
- parser  
- AST transforms  
- IR generation  
- optimized codegen  
- SSR‑aware output  
- hydration hints  

Templates compile into direct DOM operations bound to signals.

---

## **Component‑driven routing & metadata**

Nebula components can define:

- route configuration  
- SEO metadata  
- **AI metadata (planned)**  
- layouts  
- nested routes  

Routing is flexible, not prescriptive.

---

## **SSR without pain**

Nebula’s SSR model:

- components run once  
- effects do not run on the server  
- deterministic hydration  
- no hydration mismatch traps  
- hydration logs for debugging  

Streaming SSR is planned.

---

## **Style‑agnostic**

Nebula does not enforce or prefer any styling approach.

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

## **Platform‑agnostic**

Nebula Core is renderer‑agnostic.

Planned renderers:

- **nebula-web** — DOM  
- **nebula-native** — iOS/Android  
- **nebula-canvas** — Canvas/WebGL/Skia  
- **nebula-ssr** — server output  
- **nebula-terminal** — terminal UIs  

Write once, render anywhere.

---

## **DX above everything**

Nebula is built for humans:

- predictable reactivity  
- simple mental model  
- readable stack traces  
- clear error messages  
- fast HMR  
- template → IR → DOM mapping  
- devtools hooks (planned)  

Debugging is a first‑class feature.

---

# 🧩 Example Component

```nbl
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
  "keywords": ["counter", "example", "nebula"],
  "og:title": "Nebula Counter Example",
  "og:description": "A minimal counter component built with Nebula"
}
</meta>

<ai>
{
  "summary": "A simple interactive counter component that demonstrates Nebula's fine-grained reactivity.",
  "intent": "Demonstrate reactive UI updates",
  "entities": ["counter", "button", "signal"],
  "audience": "developers learning Nebula"
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
> The `<ai>` block is a **planned feature**.  
> It is not yet implemented in the SFC parser, compiler, or runtime.

---

# 🧱 Monorepo Structure

```
packages/
  compiler/        → template compiler (AST → IR → codegen)
  reactivity/      → fine‑grained reactive system
  renderer/        → platform‑agnostic renderer core
  renderer-web/    → DOM renderer + JSX runtime
  renderer-ssr/    → server renderer
  runtime/         → hydration, scheduling, lifecycle
  router/          → component‑driven routing
  sfc/             → .nbl single‑file component parser
  shared/          → shared utilities
  ui/              → optional UI primitives
```

Nebula Core stays minimal.  
Nebula Kit (future) provides structure when needed.

---

# 🛣 Roadmap (Short Version)

- ✔ Fine‑grained reactivity  
- ✔ JSX runtime  
- ✔ IR renderer  
- ✔ SSR renderer  
- ✔ Hydration  
- ✔ Routing  
- ✔ Metadata system  
- ✔ Template compiler  
- ☐ **AI metadata block (`<ai>`)**  
- ☐ Streaming SSR  
- ☐ Virtualized lists  
- ☐ Portal primitives  
- ☐ Devtools  
- ☐ Nebula Kit (meta‑framework)  
- ☐ Native renderer  
- ☐ Canvas renderer  

Full roadmap is in `ROADMAP.md`.

---

# 🧠 Philosophy Summary

Nebula aims to be:

- simple  
- fast  
- predictable  
- flexible  
- platform‑agnostic  
- scalable from small apps to enterprise systems  
- TypeScript‑first, but JS‑friendly  
- debuggable by design  

Nebula gives developers **power, not rules**.

---