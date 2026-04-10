```md
# Terajs Kit

Terajs Kit is the official application framework built on top of Terajs Core. While Terajs Core provides the rendering engine, reactivity system, and component model, Terajs Kit provides the structure needed to build full applications.

Terajs Kit is comparable to frameworks like Nuxt, Next, SvelteKit, and SolidStart — but built on Terajs’s simpler, faster, fine‑grained foundation.

Terajs Kit is optional. Terajs Core remains fully usable on its own.

---

## 1. Philosophy

Terajs Kit follows four principles:

### **1. Convention over configuration**
Developers get a predictable project structure without losing flexibility.

### **2. Server + client harmony**
Data loading, SSR, and hydration work together seamlessly.

### **3. Performance by default**
Streaming SSR, partial hydration, and virtualization are built‑in.

### **4. Platform‑agnostic**
Terajs Kit works with any Terajs renderer (DOM, native, canvas).

---

## 2. Features Overview

Terajs Kit includes:

- file‑based routing  
- nested layouts  
- route loaders (server data)  
- streaming SSR  
- partial hydration  
- server functions  
- async components  
- virtualization primitives  
- portal & slot primitives  
- built‑in UI patterns (modal, popover, toast)  
- integration patterns for ecommerce, CMS, APIs  

Terajs Kit is designed for apps of any scale — from small sites to enterprise dashboards.

---

## 3. File‑Based Routing

Terajs Kit supports a simple, predictable routing structure:

```
src/routes/
  index.tsx
  about.tsx
  products/
    [id].tsx
    index.tsx
  dashboard/
    layout.tsx
    index.tsx
```

### Dynamic routes

```
products/[id].tsx
```

### Nested layouts

```
dashboard/layout.tsx
dashboard/index.tsx
```

Layouts wrap child routes automatically.

---

## 4. Route Loaders (Server Data)

Each route can export a `load()` function:

```ts
export async function load({ params, query, cookies }) {
  return fetchProduct(params.id);
}
```

Loaders:

- run on the server  
- can be async  
- return serializable data  
- hydrate on the client  
- support streaming  

This enables SSR‑friendly data fetching without waterfalls.

---

## 5. Server Functions

Terajs Kit supports server‑only functions:

```ts
export const getUser = server(async () => {
  return db.user.find();
});
```

Server functions:

- never run on the client  
- can access secrets  
- automatically serialize results  
- integrate with loaders and actions  

Broadly, use server functions for app-owned server logic:

- database reads and writes  
- auth and session checks  
- trusted mutations  
- cookie-aware requests  
- calls that require secrets or private tokens  

Do not treat them as a replacement for OpenAPI, Kiota, or generated SDKs.

If an app already depends on a formal external service contract, Terajs can call that client directly or wrap it inside a server function when the call must stay server-only.

The broad intended shape is:

```text
UI -> Terajs app boundary -> server function -> DB or generated API client
```

### Transport Scope

Terajs Kit does not require a special Terajs-owned backend.

The client only needs an app endpoint that can dispatch server calls, such as `/_terajs/server`, mounted inside whatever server or edge adapter the app already uses.

The default transport is intentionally minimal:

- it uses standard `fetch` on the client  
- it uses standard `Request` and `Response` objects on the server side  
- it does not introduce a required RPC framework  
- it does not add a generated-client dependency  

If a runtime does not provide those primitives, the adapter can inject equivalents without changing Terajs Core or the server-function model.

---

## 6. Streaming SSR

Terajs Kit supports streaming HTML to the client:

- send above‑the‑fold content immediately  
- stream async sections as they resolve  
- hydrate progressively  
- reduce TTFB and LCP  

Streaming works with:

- async components  
- route loaders  
- nested layouts  
- portals  

---

## 7. Partial Hydration

Terajs Kit hydrates only what’s interactive:

- static sections stay static  
- interactive components hydrate lazily  
- hydration can be deferred by:
  - visibility  
  - idle time  
  - user interaction  

This keeps large pages fast.

---

## 8. Virtualized Lists & Infinite Feeds

Terajs Kit includes high‑performance list primitives:

### `<VirtualList />`
Renders only visible items.

### `<InfiniteFeed />`
Loads more items as the user scrolls.

### `useVirtualList()`
Low‑level hook for custom virtualization.

### Features:
- windowing  
- overscan  
- recycled DOM/native nodes  
- variable item heights  
- cross‑platform support  

Perfect for ecommerce grids, dashboards, and doom‑scroll feeds.

---

## 9. Portals & Overlays

Terajs Kit includes a `<Portal>` primitive for:

- modals  
- popovers  
- tooltips  
- dropdowns  
- global overlays  

Portals work across:

- web (DOM)  
- native (overlay layers)  
- canvas (z‑index layers)  
- SSR (inline rendering)  

---

## 10. Built‑In UI Patterns

Terajs Kit ships with optional UI primitives:

- `<Modal />`  
- `<Popover />`  
- `<Tooltip />`  
- `<Dropdown />`  
- `<ToastProvider />`  
- `<Overlay />`  

These are unstyled and framework‑agnostic.

---

## 11. Data Resources

Terajs Kit includes `createResource()` for async state:

```ts
const user = createResource(() => fetchUser());
```

Features:

- caching  
- refetching  
- loading/error states  
- SSR hydration  
- suspense‑free async flows  

---

## 12. Integration Patterns

Terajs Kit provides examples and adapters for:

- ecommerce (Shopify, Medusa, Commerce.js)  
- CMS (Sanity, Contentful, Strapi)  
- APIs (REST, GraphQL, tRPC)  
- authentication providers  
- design systems  

Terajs Kit does not enforce a backend.

---

## 13. Multi‑Platform Support

Terajs Kit works with any Terajs renderer:

- **packages/renderer-web** (web)  
- **packages/renderer-ios** and **packages/renderer-android** (native)  
- **packages/renderer-canvas** (Skia/WebGL)  
- **packages/renderer-ssr** (SSR)  

Routing, loaders, and hydration adapt to the renderer.

---

## 14. Philosophy Summary

Terajs Kit is:

- structured  
- scalable  
- SSR‑first  
- performance‑focused  
- cross‑platform  
- flexible  
- batteries‑included  

Terajs Core = rendering engine.  
Terajs Kit = full application framework.

```