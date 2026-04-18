#  Terajs Roadmap (Updated)

Terajs is a fine‑grained, compiler‑powered UI framework designed for clarity, performance, and flexibility. This roadmap reflects Terajs’s current architecture and future direction.

This roadmap mixes shipped and planned items. Canonical shipped API behavior is documented in `API_REFERENCE.md` and `README.md`.

Terajs’s philosophy:  
> **Provide structure without restricting creativity.  
> Stay fast, predictable, and platform‑agnostic.  
> TypeScript‑first, but TypeScript‑optional.**

---

## **1. Fine‑Grained Reactivity**

Terajs uses explicit, dependency‑tracked signals:

- `signal()` for reactive values  
- `computed()` for derived values  
- `effect()` for side effects  
- deterministic updates  
- no VDOM  
- direct DOM/native updates  

Reactivity is predictable, fast, and SSR‑safe.

---

## **2. Component Model**

Terajs components are **units of UI, logic, metadata, and routing**:

- props → logic → template → styles → meta → route  
- JSX templates  
- optional SFC format (`.tera`)  
- templates compile to IR → DOM  
- components run once; templates update reactively  

Terajs is **TypeScript‑first**, but every feature works in plain JavaScript.

---

## **3. Props System**

- TypeScript‑first  
- fully inferred  
- immutable  
- simple, predictable API  
- works identically in JS and TS  

---

## **4. Styles (Fully Optional)**

Terajs is **style‑agnostic**.

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

## **5. Async Components**

Route and module-level async loading are shipped; a standalone public `lazy(...)` helper is not part of the current shipped API surface.

- route and module-level async loading follow component and route boundaries
- SSR‑friendly  
- predictable hydration  
- async logic stays in the component or route module, not the template

---

## **6. SSR & Hydration**

Terajs’s SSR model:

- components run once  
- effects do not run on the server  
- deterministic hydration  
- no VDOM diffing  
- no hydration mismatch traps  
- hydration logs for debugging  

Streaming SSR is available via `@terajs/renderer-ssr` and will continue to be hardened.

---

## **7. Routing System**

Terajs’s router is **component‑driven**:

- routes defined inside components  
- meta (SEO + AI) defined per component  
- nested routes & layouts  
- async route components  
- SSR‑aware loaders  
- simple guards & redirects  
- optional file‑based routing  

Routing is flexible, not prescriptive.

---

## **8. Meta System (SEO + AI)**

Terajs treats metadata as first‑class:

- title, description, OpenGraph  
- AI hints, semantic tags  
- component‑level meta  
- template‑level overrides  
- route‑level aggregation  

This enables AI‑aware tooling and consistent SEO.

---

## **9. State Management**

Terajs ships fine-grained reactivity plus explicit dependency injection today, with additional state convenience layers still directional.

Shipped today:

- `signal()` and `state()` for local and shared state seams
- `computed()` for derived state
- `provide()` / `inject()` for dependency injection
- `createResource()` and `createAction()` for async state
- SSR‑safe hydration and DevTools support

Directional / planned convenience layers:

- higher-level structured store helpers
- additional context ergonomics on top of the current runtime injection model

---

## **10. Tooling & Build Integration**

Terajs supports:

- Vite (first‑class)  
- ESBuild / Rollup  
- JSX transforms  
- optional scoped‑style transforms  
- fast HMR with preserved state  
- TypeScript‑first DX  
- zero‑config JS support  

Debugging is a priority:

- readable stack traces  
- hydration logs  
- reactive graph inspection  
- template → IR → DOM mapping  

---

## **11. Multi‑Platform Rendering**

Terajs Core is renderer‑agnostic.

Planned renderers:

- **packages/renderer-web** — DOM  
- **packages/renderer-ios** and **packages/renderer-android** — native renderers  
- **packages/renderer-canvas** — Canvas/WebGL/Skia  
- **packages/renderer-ssr** — server output  
- **packages/renderer-terminal** — terminal UIs  

Components remain the same; only the renderer changes.

---

## **12. Template Compiler**

Terajs includes a full compiler:

- tokenizer  
- parser  
- AST transforms  
- IR generation  
- optimized codegen  
- SSR‑aware output  
- hydration hints  

Templates compile into direct DOM operations bound to signals.

---

## **13. Slots & Composition**

Terajs supports:

- default slots  
- named slots  
- scoped slots  
- slot functions  

Slots are fully reactive and SSR‑safe.

---

## **14. Portals (Teleporting Content)**

Terajs includes a `<Portal>` primitive:

- modals, popovers, tooltips  
- works across web, native, canvas  
- hydration‑safe  
- fine‑grained updates  

---

## **15. Virtualized Lists & Infinite Feeds**

Terajs will include high‑performance list primitives:

- `<VirtualList />`  
- `<InfiniteFeed />`  
- windowing & overscan  
- recycled DOM/native nodes  
- variable item heights  
- infinite scrolling  

Designed for dashboards, ecommerce, and social feeds.

---

## **16. Data Loading & Server Functions**

Terajs Kit will include:

- route‑level loaders  
- `createResource()` for async data  
- caching & refetching  
- error/loading states  
- server‑only functions  
- streaming data  
- hydration with serialized data  

---

## **17. Terajs Kit (Application Framework Layer)**

Terajs Kit is the batteries‑included meta‑framework:

- file‑based routing  
- data loaders  
- streaming SSR  
- partial hydration  
- virtualization components  
- portal & slot primitives  
- built‑in UI patterns  
- ecommerce/CMS/API integrations  

Terajs Core = rendering engine.  
Terajs Kit = full application framework.

---

## **18. Philosophy Summary**

Terajs aims to be:

- simple  
- fast  
- predictable  
- flexible  
- platform‑agnostic  
- scalable from small apps to enterprise systems  
- TypeScript‑first, but JS‑friendly  
- debuggable by design  

Terajs Core stays minimal.  
Terajs Kit provides structure when needed.

---
