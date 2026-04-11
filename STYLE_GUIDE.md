# Terajs Style Guide

Terajs encourages clarity, predictability, and small composable pieces — without forcing a rigid structure. These conventions help teams write consistent, maintainable components while preserving full flexibility.

Terajs’s philosophy:  
> **Provide structure without restricting creativity.**

Terajs is:  
- **TypeScript‑first, but TypeScript‑optional**  
- **style‑agnostic**  
- **platform‑agnostic**  
- **DX‑driven**  
- **debuggable by design**  

---

## 1. File Naming

Use **PascalCase** for components:

```
Button.tsx
UserProfile.tsx
Counter.tsx
```

Use **camelCase** or **kebab-case** for utilities:

```
useFetch.ts
formatDate.ts
router.ts
```

Terajs does not enforce a folder structure — choose what fits your team.

---

## 2. Recommended Component Structure

Terajs components can include logic, template, styles, metadata, and routing in one file.

```tsx
// --- Props ---
export interface Props {}

// --- Logic ---
export function Component(props: Props) {
  const count = signal(0)

  // --- Template ---
  return () => (
    <div class="root">
      Count: {count()}
    </div>
  )
}

// --- Styles (optional) ---
export const styles = `
  .root { padding: 8px; }
`

// --- Meta (optional) ---
export const meta = {
  title: "Counter",
  description: "A simple counter component"
}

// --- Route config (optional) ---
export const route = {
  path: "/counter"
}
```

This structure is recommended, not required.

---

## 3. Keep Components Small

Aim for:

- one responsibility per component  
- under ~200 lines  
- splitting large components into multiple files  

Example folder structure:

```
UserCard/
  UserCard.tsx
  UserCard.logic.ts
  UserCard.template.tsx
  UserCard.styles.css
```

Terajs does not enforce this — it’s just a helpful pattern.

---

## 4. Use Computed Values for Derived State

Avoid recalculating expensive values inside templates.

Avoid:

```tsx
return () => <div>{expensiveCalculation()}</div>
```

Prefer:

```ts
const result = computed(expensiveCalculation)

return () => <div>{result()}</div>
```

---

## 5. Keep Templates Pure

Templates should:

- contain no side effects  
- only read reactive values  
- avoid heavy logic  
- avoid creating new objects/functions unnecessarily  

Good:

```tsx
return () => <div>{count()}</div>
```

Bad:

```tsx
return () => <div>{Math.random()}</div>
```

---

## 6. Styling: Use Anything You Want

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

Terajs does not enforce or prefer any styling approach.

### Terajs Brand Tokens

For the main website and future marketing surfaces, use this shared Terajs palette:

```css
:root {
  --tera-black: #0D0D0D;
  --tera-carbon: #1A1A1A;
  --tera-graphite: #2E2E2E;
  --tera-blue: #3A7BFF;
  --tera-cyan: #4FE3FF;
  --tera-purple: #8A5CFF;
  --tera-mist: #B3B3B3;
  --tera-cloud: #F5F5F5;
}
```

Recommended font stacks:

```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
font-family: "Space Grotesk", "Inter", sans-serif;
font-family: "JetBrains Mono", "Fira Code", monospace;
```

Tailwind usage reference:

```js
theme: {
  extend: {
    colors: {
      tera: {
        black: '#0D0D0D',
        carbon: '#1A1A1A',
        graphite: '#2E2E2E',
        blue: '#3A7BFF',
        cyan: '#4FE3FF',
        purple: '#8A5CFF',
        mist: '#B3B3B3',
        cloud: '#F5F5F5'
      }
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      heading: ['Space Grotesk', 'Inter', 'sans-serif'],
      code: ['JetBrains Mono', 'Fira Code', 'monospace'],
      satoshi: ['Satoshi', 'Inter', 'sans-serif']
    }
  }
}
```

Suggested usage:

- `--tera-black` for dark backgrounds
- `--tera-carbon` for cards and surfaces
- `--tera-graphite` for borders and dividers
- `--tera-blue` for primary actions
- `--tera-cyan` for hover and interactive emphasis
- `--tera-purple` for highlights and branded accents
- `--tera-mist` for muted text
- `--tera-cloud` for primary foreground text on dark UI

Scoped styles are optional:

```ts
export const styles = `
  .root { padding: 8px; }
`
```

---

## 7. Prefer Composition Over Inheritance

Break UI into small reusable pieces:

```tsx
<Toolbar>
  <Button label="Save" />
  <Button label="Cancel" />
</Toolbar>
```

Avoid deeply nested component logic.

---

## 8. SSR‑Safe Patterns

Avoid:

- direct DOM access in logic  
- timers in SSR mode  
- effects on the server  

Use `isServer()` when needed:

```ts
if (!isServer()) {
  effect(() => console.log("client only"))
}
```

---

## 9. Organize State Thoughtfully

Use:

- `signal()` for local state  
- `createStore()` for global state  
- `createContext()` for dependency injection  

Avoid:

- global singletons unless intentional  
- prop drilling through many layers  

---

## 10. Naming Conventions

### Components:
- PascalCase  
- descriptive names  

### Signals:
- `count`, `isOpen`, `user`  

### Computed values:
- `doubleCount`, `formattedDate`  

### Event handlers:
- `handleSubmit`, `handleClick`  

---

## 11. Event Handlers

Use descriptive names:

```ts
function handleSubmit() {}
function handleClick() {}
```

Avoid inline anonymous handlers when possible.

---

## 12. Async Logic

Use async functions inside logic, not templates:

```ts
async function loadUser() {
  user.set(await fetchUser())
}
```

Avoid async templates.

---

## 13. Error Handling

Use try/catch inside logic:

```ts
async function load() {
  try {
    data.set(await fetchData())
  } catch (err) {
    error.set(err)
  }
}
```

Avoid throwing errors inside templates.

---

## 14. Reactivity Best Practices

Terajs uses fine‑grained, explicit dependency tracking.

- avoid deep reactive objects  
- use nested signals for nested state  
- keep dependencies explicit  
- avoid unnecessary watchers  
- prefer computed values for derived data  

---

## 15. Slots & Composition Patterns

Terajs supports:

- default slots  
- named slots  
- scoped slots  

Use slots for:

- layout components  
- cards, modals, popovers  
- lists and data tables  

Slots should be pure functions.

---

## 16. Portals & Overlays

Use `<Portal>` for:

- modals  
- popovers  
- tooltips  
- dropdowns  

Portals should contain UI, not business logic.

---

## 17. Debugging Best Practices

Terajs is designed to be easy to debug:

- keep signal names meaningful  
- avoid deeply nested reactive chains  
- use computed values for clarity  
- keep templates pure  
- avoid mixing side effects with rendering  

Readable code = debuggable code.

---

## 18. Philosophy Summary

Terajs encourages components that are:

- small  
- predictable  
- pure  
- composable  
- SSR‑safe  
- cross‑platform  
- easy to read and maintain  

These guidelines help teams build consistent, scalable Terajs applications without sacrificing flexibility.

---
