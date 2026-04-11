# @terajs/renderer-web

Web renderer for Terajs.

This package contains DOM rendering, hydration, JSX runtime helpers, form primitives, router-view integration, and web component integration.

## Install

```bash
npm install @terajs/renderer-web
```

## Core APIs

- Rendering: `mount`, `unmount`, `renderFromIR`
- Hydration: `hydrateRoot`
- JSX runtime: `jsx`, `jsxs`, `Fragment`
- Forms: `Form`, `SubmitButton`, `FormStatus`
- Routing UI: `createRouteView`, `Link`
- Web Components: `defineCustomElement`

## Minimal Example

```ts
import { mount } from "@terajs/renderer-web";

function App() {
  return document.createTextNode("Hello Terajs");
}

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app root element.");

mount(App, root);
```

## Notes

- Hydration expects server-rendered markup and consumes matching nodes in place.
- Browser-specific integrations stay in this package, not in runtime-neutral layers.
