# Terajs SFC (Single-File Component) System

Terajs SFCs are the heart of your UI. They combine template, logic, style, and meta in a single file.

---

## SFC Structure

```html
<template>
  <div>Hello, {{ name }}</div>
</template>
<script>
  export let name = 'World';
</script>
<style>
  div { color: blue; }
</style>
<meta>
  title: Hello Page
</meta>
```

---

## Features
- **TypeScript-first**: Use TS in `<script>` blocks.
- **Auto-imports**: All components in configured dirs are globally available.
- **Scoped styles**: Styles are scoped to the component by default.
- **Meta/AI/Route blocks**: For advanced features and integrations.

---

## Usage Example

```html
<template>
  <FancyButton @click="onClick">Click me</FancyButton>
</template>
<script>
  function onClick() {
    alert('Clicked!');
  }
</script>
```

No import needed for `<FancyButton />` if it’s in your auto-import dirs.

---

## Advanced
- Use `<meta>` for SEO and page info.
- Use `<ai>` for AI-driven features (planned).
- Use `<route>` for route config (planned).

---

## DevTools
- Inspect SFCs live in the Terajs DevTools overlay.
- See component tree, signals, effects, and logs in real time.

---

## API Reference
- `parseSFC(code: string, id: string): SFCDescriptor`
- `sfcToComponent(sfc: SFCDescriptor): string`

---

See the devtools and vite plugin docs for more on auto-imports and live inspection.
