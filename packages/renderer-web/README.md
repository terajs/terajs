# @terajs/renderer-web

Browser renderer for Terajs.

This package contains DOM rendering, hydration, JSX runtime helpers, form primitives, route-view integration, browser history, client-side metadata updates, and custom-element integration.

Most applications reach this surface through `@terajs/app`. Use `@terajs/renderer-web` directly when you are building a custom host, a library, or a lower-level integration.

## Install

```bash
npm install @terajs/renderer-web @terajs/runtime
```

## Key surface areas

- Rendering and mounting: `mount`, `unmount`
- Hydration: `hydrateRoot`
- JSX runtime: `jsx`, `jsxs`, `Fragment`
- Direct DOM bindings and IR rendering: `renderIRModuleToFragment`, binding helpers, keyed updates
- Browser routing UI: `createBrowserHistory`, `createRouteView`, `Link`, route-shell helpers
- Forms: `Form`, `SubmitButton`, `FormStatus`
- Error handling: `withErrorBoundary`
- Web Components: `defineCustomElement`

## Minimal Example

```ts
import { component } from "@terajs/runtime";
import { mount } from "@terajs/renderer-web";

const App = component({ name: "App" }, () => () => document.createTextNode("Hello Terajs"));

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app root element.");

mount(App, root);
```

## Notes

- Hydration expects server-rendered markup and consumes matching nodes in place.
- Browser-specific integrations stay in this package, not in runtime-neutral layers.
- `defineCustomElement()` is useful when you want to cross framework boundaries with browser-native custom elements.
