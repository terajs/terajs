# Terajs Runtime

The Terajs runtime coordinates component mounting, context, and the connection between reactivity and the DOM.

---

## Features
- Platform-agnostic: works in browser, SSR, and custom renderers
- Context system for dependency injection
- Lifecycle hooks for mounting, updating, and disposal
- Integrates with Terajs's fine-grained reactivity

---

## Usage Example

```ts
import { mount } from '@terajs/runtime';
import App from './App.tera';

mount(App, document.getElementById('app'));
```

---

## Context API

```ts
import { createComponentContext, getCurrentContext, setCurrentContext } from '@terajs/shared';

const ctx = createComponentContext();
setCurrentContext(ctx);
```

---

## DevTools Integration
- All runtime events are streamed to the devtools overlay for live inspection.

---

## API Reference
- `mount(component, el)`
- `createComponentContext()`
- `getCurrentContext()`
- `setCurrentContext(ctx)`

---

See the devtools and shared package docs for more on debugging and inspection.

