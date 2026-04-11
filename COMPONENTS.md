```md
# Terajs Component System

Status note (April 2026): This guide describes component philosophy and patterns. For exact shipped APIs and signatures, use API_REFERENCE.md.

Terajs components are lightweight functions built on fine‑grained reactivity. Components run once; templates update automatically when reactive values change. This makes Terajs predictable, fast, and easy to reason about.

Terajs encourages a simple structure inside `.tsx` files:

- Props  
- Logic (state, computed, effects, handlers)  
- Template (JSX)  
- Styles (optional, scoped)  

This structure is recommended, not enforced.

---

## 1. Component Anatomy

A typical Terajs component:

```tsx
export interface ExampleProps {
  value: number;
}

export function Example(props: ExampleProps) {
  const count = state(props.value);

  return () => (
    <div>{count.get()}</div>
  );
}
```

Key ideas:

- Components execute once  
- The returned function is the template  
- Signals update the DOM/native views directly  
- No VDOM, no diffing, no re‑rendering  

---

## 2. Props

Props are defined using TypeScript interfaces:

```ts
export interface ButtonProps {
  label: string;
  disabled?: boolean;
}
```

Usage:

```tsx
<Button label="Save" disabled />
```

Props are:

- fully typed  
- inferred automatically  
- immutable  
- SSR‑safe  

---

## 3. Logic Section

The logic section contains:

- state  
- computed values  
- effects  
- event handlers  
- async operations  

Example:

```ts
const count = state(0);
const double = computed(() => count.get() * 2);

function increment() {
  count.set(count.get() + 1);
}
```

Logic runs once and never re‑runs on updates.

---

## 4. Template Section

The template is a function returning JSX:

```tsx
return () => (
  <button onClick={increment}>
    Count: {count.get()}
  </button>
);
```

Template rules:

- should be pure  
- should only read reactive values  
- should avoid heavy computations  
- runs only when needed  

Terajs updates only the parts of the UI that depend on reactive reads.

---

## 5. Styles (Optional)

Components may export scoped styles:

```ts
export const styles = `
  button {
    padding: 8px;
    border-radius: 6px;
  }
`;
```

Terajs will:

- generate a unique class for the component  
- scope the styles at runtime  
- apply the class to the component root  

Supports:

- global CSS  
- Tailwind  
- CSS modules  
- design systems  

---

## 6. Child Components & Composition

Composition is straightforward:

```tsx
import { Button } from "./Button";

export function Toolbar() {
  return () => (
    <div>
      <Button label="Save" />
      <Button label="Cancel" />
    </div>
  );
}
```

No registration, no boilerplate, no magic.

---

## 7. Async Components

Terajs supports async components via:

```ts
const User = lazy(() => import("./User"));
```

Behavior:

- loads component asynchronously  
- works in SSR (server awaits the component)  
- hydrates normally on the client  
- no Suspense boundaries  
- no waterfalls  

---

## 8. Lifecycle & Cleanup

Terajs supports cleanup via:

```ts
effect(() => {
  const id = setInterval(() => console.log("tick"), 1000);

  onCleanup(() => clearInterval(id));
});
```

Cleanup runs:

- before the effect re‑runs  
- when the component unmounts  
- when the watcher stops  

Effects do not run on the server.

---

## 9. SSR Behavior

Terajs follows a simple rule:

> If it works on the client, it works on the server — except DOM operations and effects.

SSR guarantees:

- components can be async  
- logic runs once  
- effects are skipped  
- hydration is deterministic  
- no VDOM diffing  
- no hydration mismatch traps  

---

## 10. Multi‑File Components (Optional)

Terajs supports splitting large components:

```
UserCard/
  UserCard.tsx
  UserCard.logic.ts
  UserCard.template.tsx
  UserCard.styles.css
```

This is optional and not enforced.

---

## 11. Interoperability

Terajs components work with:

- any DOM‑based UI library  
- any CSS framework  
- Web Components  
- JSX‑based design systems  
- native renderers (packages/renderer-ios, packages/renderer-android)  
- canvas renderers (packages/renderer-canvas)  

Terajs does not impose a custom component universe.

---

## 12. Reactivity: Deep vs Shallow Watching

Terajs uses fine‑grained, explicit dependency tracking.

- **Shallow watching is the default**  
- **Deep watching is not supported**  
- **Effects track exactly what they read**  
- **Nested objects should use nested signals**  

Example:

```ts
const user = {
  name: state("Gabriel"),
  age: state(30),
};

effect(() => {
  console.log(user.name.get()); // tracks only "name"
});
```

This keeps reactivity predictable, fast, and SSR‑safe.

---

## 13. Slots (Default, Named, Scoped)

Terajs supports flexible slot patterns using JSX functions.

### Default Slot

```tsx
export function Card(props) {
  return () => (
    <div class="card">
      {props.children?.()}
    </div>
  );
}
```

### Named Slots

```tsx
export interface ModalProps {
  header?: () => JSX.Element;
  footer?: () => JSX.Element;
  children?: () => JSX.Element;
}
```

### Scoped Slots

```tsx
<List
  items={users}
  item={user => <UserCard user={user} />}
/>
```

Slots are fully reactive and SSR‑safe.

---

## 14. Portals (Teleporting Content)

Terajs includes a `<Portal>` primitive for rendering content outside the normal hierarchy.

Example:

```tsx
<Portal to="body">
  <Modal>...</Modal>
</Portal>
```

Behavior:

- web: mounts into DOM node  
- native: mounts into overlay layer  
- canvas: draws into higher z‑index layer  
- server: renders inline  

Used for modals, popovers, tooltips, dropdowns, and overlays.

---

## 15. Philosophy Summary

Terajs components are:

- simple  
- fast  
- predictable  
- SSR‑safe  
- flexible  
- cross‑platform  
- easy to read and maintain  

Terajs provides a recommended pattern without restricting how developers build their components.
```
