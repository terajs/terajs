# Nebula Vision

Nebula is a next‑generation UI framework built on three core principles:

---

## 1. Fine‑Grained Reactivity

Nebula’s reactivity system is:

- synchronous  
- deterministic  
- dependency‑tracked  
- cleanup‑aware  
- SSR‑safe  

No VDOM. No batching. No re‑rendering entire components.

Signals update the DOM directly.

---

## 2. Developer Experience First

Nebula aims to be:

- intuitive for beginners  
- powerful for experts  
- predictable in behavior  
- minimal in boilerplate  
- flexible in structure  

Nebula provides **conventions**, not constraints.

---

## 3. SSR Without Pain

Nebula’s SSR philosophy:

> **SSR should be easy, predictable, and require no special mental model.**

This means:

- effects do not run on the server  
- components can be async  
- hydration is deterministic  
- no Suspense complexity  
- no hydration mismatch traps  

---

## 4. Components That Feel Familiar, But Work Better

Nebula components use a recommended structure:

- Props  
- Logic  
- Template  
- Styles  

All inside `.tsx`, with full syntax highlighting and no custom file format.

---

## 5. Escape Hatches Everywhere

Nebula is not a prison.

Developers can:

- structure files however they want  
- use or ignore scoped styles  
- write components in multiple styles  
- build custom renderers  
- integrate with any bundler  

Nebula stays out of the way.

---

## 6. Small, Reusable, Composable Pieces

Nebula encourages:

- small components  
- clear boundaries  
- predictable composition  
- easy child‑parent communication  

This keeps codebases maintainable at scale.

---

Nebula’s vision is simple:

> **A framework that feels familiar, performs like Solid, reads like Vue, and stays as flexible as React — without their complexity.**
  vision UPDATE:

  Got it—that’s a very specific and important part of your vision: **components that are not just UI units, but also carry SEO + AI metadata and routing behavior**.

Here’s your vision updated to reflect that, without changing your core goals or tone.

---

# Nebula Vision

Nebula is a next‑generation UI framework built on three core principles:

---

## 1. Fine‑grained reactivity

Nebula’s reactivity system is:

- synchronous  
- deterministic  
- dependency‑tracked  
- cleanup‑aware  
- SSR‑safe  

No VDOM. No batching. No re‑rendering entire components.

Signals update the DOM directly, and the compiler emits instructions that bind DOM nodes to reactive sources with minimal overhead.

---

## 2. Developer experience first

Nebula aims to be:

- intuitive for beginners  
- powerful for experts  
- predictable in behavior  
- minimal in boilerplate  
- flexible in structure  

Nebula provides **conventions**, not constraints.

You can:

- write components in `.tsx` or SFC‑style files  
- mix JSX and templates  
- structure projects however you like  
- opt into or out of higher‑level features  

---

## 3. SSR without pain

Nebula’s SSR philosophy:

> **SSR should be easy, predictable, and require no special mental model.**

This means:

- effects do not run on the server  
- components can be async  
- hydration is deterministic  
- no Suspense complexity  
- no hydration mismatch traps  

The same component model works on both server and client.

---

## 4. Components that feel familiar, but work better

Nebula components are more than view functions—they are **units of behavior, metadata, and routing**.

A component can define:

- props, state, context, lifecycle, cleanup  
- template and styles  
- **meta tags for SEO and AI (title, description, OpenGraph, AI hints, etc.)**  
- **route configuration (path, params, layouts, guards)**  

Nebula’s routing and meta systems are **component‑driven**:

- routes can be declared at the component level  
- meta tags can be defined in components and **overridden in templates**  
- layouts and nested routes are expressed through composition  
- routes can automatically handle **lazy imports** and code‑splitting based on component boundaries  

The recommended structure:

- Props  
- Logic  
- Template  
- Styles  
- Meta (SEO + AI)  
- Route configuration  

All inside `.tsx` or SFC‑style files, with full tooling support.

---

## 5. A real template compiler

Nebula includes a full template pipeline:

- tokenizer and parser  
- AST and directive transforms  
- IR generation  
- optimized codegen to render functions  

Templates compile into direct DOM operations bound to signals—no VDOM, no diffing, no component re‑render loops.

Routing and meta can also be expressed in templates, with the ability to:

- override route‑level meta per view  
- attach AI/SEO hints at the template level  
- drive navigation and layout from declarative markup  

---

## 6. Escape hatches everywhere

Nebula is not a prison.

Developers can:

- structure files however they want  
- use or ignore scoped styles  
- write components in multiple styles  
- build custom renderers  
- integrate with any bundler  
- drop down to low‑level DOM or runtime APIs  
- bypass the router or meta system when needed  

Nebula stays out of the way.

---

## 7. Small, reusable, composable pieces

Nebula encourages:

- small components  
- clear boundaries  
- predictable composition  
- easy child‑parent communication  

This keeps codebases maintainable at scale.

---

## 8. Meta‑aware and AI‑ready

Nebula treats **meta information as a first‑class concern**:

- components can declare SEO and AI metadata alongside their logic and template  
- routes can automatically derive meta from components, or override it  
- templates can refine or override meta at a finer granularity  
- the runtime exposes a structured view of routes, components, and meta for tools and AI  

This enables:

- consistent SEO across routes  
- AI‑friendly hints embedded in components and templates  
- automatic route‑based code‑splitting and imports  
- higher‑level tools that can reason about your app’s pages, flows, and semantics—not just its DOM.

---

Nebula’s vision is simple:

> **A framework that feels familiar, performs like Solid, reads like Vue, stays as flexible as React, and treats routing, SEO, and AI metadata as first‑class citizens—without their complexity.**