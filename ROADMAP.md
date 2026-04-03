#  Nebula Roadmap (Updated)

Nebula is a fine‑grained, compiler‑powered UI framework designed for clarity, performance, and flexibility. This roadmap reflects Nebula’s current architecture and future direction.

Nebula’s philosophy:  
> **Provide structure without restricting creativity.  
> Stay fast, predictable, and platform‑agnostic.  
> TypeScript‑first, but TypeScript‑optional.**

---

## **1. Fine‑Grained Reactivity**

Nebula uses explicit, dependency‑tracked signals:

- `signal()` for reactive values  
- `computed()` for derived values  
- `effect()` for side effects  
- deterministic updates  
- no VDOM  
- direct DOM/native updates  

Reactivity is predictable, fast, and SSR‑safe.

---

## **2. Component Model**

Nebula components are **units of UI, logic, metadata, and routing**:

- props → logic → template → styles → meta → route  
- JSX templates  
- optional SFC format (`.nbl`)  
- templates compile to IR → DOM  
- components run once; templates update reactively  

Nebula is **TypeScript‑first**, but every feature works in plain JavaScript.

---

## **3. Props System**

- TypeScript‑first  
- fully inferred  
- immutable  
- simple, predictable API  
- works identically in JS and TS  

---

## **4. Styles (Fully Optional)**

Nebula is **style‑agnostic**.

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

- `lazy(() => import(...))`  
- SSR‑friendly  
- no Suspense boundaries  
- predictable hydration  
- async logic stays in the component, not the template  

---

## **6. SSR & Hydration**

Nebula’s SSR model:

- components run once  
- effects do not run on the server  
- deterministic hydration  
- no VDOM diffing  
- no hydration mismatch traps  
- hydration logs for debugging  

Streaming SSR is planned.

---

## **7. Routing System**

Nebula’s router is **component‑driven**:

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

Nebula treats metadata as first‑class:

- title, description, OpenGraph  
- AI hints, semantic tags  
- component‑level meta  
- template‑level overrides  
- route‑level aggregation  

This enables AI‑aware tooling and consistent SEO.

---

## **9. State Management**

Nebula expands reactivity into global state:

- `createStore()` for structured global state  
- `createContext()` / `useContext()`  
- derived stores  
- async resources  
- SSR‑safe hydration  
- devtools support  

---

## **10. Tooling & Build Integration**

Nebula supports:

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

Nebula Core is renderer‑agnostic.

Planned renderers:

- **nebula-web** — DOM  
- **nebula-native** — iOS/Android  
- **nebula-canvas** — Canvas/WebGL/Skia  
- **nebula-ssr** — server output  
- **nebula-terminal** — terminal UIs  

Components remain the same; only the renderer changes.

---

## **12. Template Compiler**

Nebula includes a full compiler:

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

Nebula supports:

- default slots  
- named slots  
- scoped slots  
- slot functions  

Slots are fully reactive and SSR‑safe.

---

## **14. Portals (Teleporting Content)**

Nebula includes a `<Portal>` primitive:

- modals, popovers, tooltips  
- works across web, native, canvas  
- hydration‑safe  
- fine‑grained updates  

---

## **15. Virtualized Lists & Infinite Feeds**

Nebula will include high‑performance list primitives:

- `<VirtualList />`  
- `<InfiniteFeed />`  
- windowing & overscan  
- recycled DOM/native nodes  
- variable item heights  
- infinite scrolling  

Designed for dashboards, ecommerce, and social feeds.

---

## **16. Data Loading & Server Functions**

Nebula Kit will include:

- route‑level loaders  
- `createResource()` for async data  
- caching & refetching  
- error/loading states  
- server‑only functions  
- streaming data  
- hydration with serialized data  

---

## **17. Nebula Kit (Application Framework Layer)**

Nebula Kit is the batteries‑included meta‑framework:

- file‑based routing  
- data loaders  
- streaming SSR  
- partial hydration  
- virtualization components  
- portal & slot primitives  
- built‑in UI patterns  
- ecommerce/CMS/API integrations  

Nebula Core = rendering engine.  
Nebula Kit = full application framework.

---

## **18. Philosophy Summary**

Nebula aims to be:

- simple  
- fast  
- predictable  
- flexible  
- platform‑agnostic  
- scalable from small apps to enterprise systems  
- TypeScript‑first, but JS‑friendly  
- debuggable by design  

Nebula Core stays minimal.  
Nebula Kit provides structure when needed.

---
