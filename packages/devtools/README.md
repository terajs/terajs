
# Nebula DevTools

Nebula DevTools provides a live overlay for inspecting your app’s component tree, signals, effects, and runtime events. Built with Nebula SFCs and styled with Tailwind.

---

## Features
- Live component tree and signal/effect inspection
- Issues and logs panel (live error/warning surfacing)
- Meta/AI/route data viewer
- Theme preview and color abstraction
- **Auto-imports**: All SFCs in `src/components` are globally available

---

## Usage

### 1. Mount the overlay

In your app entry point:

```js
import { mountDevtoolsOverlay } from '@nebula/devtools';
mountDevtoolsOverlay();
```

### 2. Use auto-imported components

Any `.nbl` file in `src/components` (or configured dirs) is globally available in your SFCs:

```
<template>
	<FancyButton />
</template>
```

No import needed!

---

## Theming
Edit `tailwind.config.js` and `src/index.css` to customize colors and theme tokens.

---

## Advanced: Customizing auto-imports

Add a `nebula.config.js` to your project root:

```js
module.exports = {
	autoImportDirs: [
		'packages/devtools/src/components',
		'src/components',
	]
};
```

---

## Development
- Tailwind config: `tailwind.config.js`
- Main stylesheet: `src/index.css`
- Overlay UI: `src/app.ts`, `src/overlay.ts`

---

## Example: Adding a new panel

1. Create `src/components/MyPanel.nbl`:
	 ```
	 <template>
		 <div>My Custom Panel</div>
	 </template>
	 <script>
	 // Panel logic here
	 </script>
	 ```
2. Add to the `tabs` array in `DevtoolsApp.nbl`:
	 ```js
	 export let tabs = [..., 'MyPanel']
	 ```
3. Use `<MyPanel v-if="activeTab === 'MyPanel'" />` in the template.

---

## Testing
Run tests with:
```
npx vitest run
```
