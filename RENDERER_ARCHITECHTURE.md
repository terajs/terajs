```md
# Terajs Renderer Architecture

Terajs Core is intentionally renderer‑agnostic. It provides reactivity, component execution, and template evaluation — but it does not know anything about the DOM, native UI systems, or canvas drawing APIs.

Renderers implement the platform‑specific details.

This document defines the renderer interface, lifecycle, responsibilities, and design principles that allow Terajs to target:

- Web (DOM)
- Native (iOS/Android)
- Canvas/WebGL/Skia
- Server (SSR)
- Terminal (future)
- Any custom rendering environment

---

## 1. Philosophy

Terajs follows three renderer principles:

### **1. Core is universal**
Reactivity, components, and templates work identically across all platforms.

### **2. Renderers are thin**
Renderers only implement:
- node creation
- node updates
- node removal
- event binding
- layout/positioning (if applicable)

### **3. Templates are declarative**
Terajs templates describe *what* to render; renderers decide *how*.

---

## 2. Renderer Responsibilities

A renderer must implement the following responsibilities:

### **1. Create nodes**
```ts
createElement(type: string): Node
createText(value: string): Node
createFragment(): Node
```

### **2. Insert nodes**
```ts
insert(parent: Node, child: Node, anchor?: Node): void
```

### **3. Remove nodes**
```ts
remove(node: Node): void
```

### **4. Update nodes**
```ts
setText(node: Node, value: string): void
setProp(node: Node, name: string, value: any): void
setStyle(node: Node, style: Record<string, string>): void
setClass(node: Node, className: string): void
```

### **5. Event binding**
```ts
addEvent(node: Node, name: string, handler: Function): void
removeEvent(node: Node, name: string): void
```

### **6. Lifecycle hooks (optional)**
```ts
onMount(node: Node): void
onUnmount(node: Node): void
```

Renderers may implement additional platform‑specific APIs.

---

## 3. Template Execution Flow

Terajs components return a template function:

```ts
return () => <div>Hello</div>;
```

Terajs Core:

1. Executes the template  
2. Produces a lightweight description of nodes  
3. Calls renderer methods to create/update/remove nodes  
4. Tracks reactive reads  
5. Re‑runs only the parts of the template that depend on changed signals  

Renderers never re‑run components — only update nodes.

---

## 4. Renderer Types

Terajs supports multiple renderer implementations.

---

### **4.1 packages/renderer-web (Web)**

Implements:

- `document.createElement`
- `textContent`
- `className`
- `style`
- DOM events
- DOM insertion/removal

Used for:
- web apps
- ecommerce storefronts
- dashboards
- admin panels

---

### **4.2 packages/renderer-ios / packages/renderer-android (iOS/Android)**

Maps JSX tags to native UI elements:

```tsx
<View>
  <Text>Hello</Text>
</View>
```

Under the hood:

- `<View>` → UIView (iOS) or Android View  
- `<Text>` → UILabel or TextView  
- `<Image>` → UIImageView or ImageView  

Renderer handles:

- native layout  
- native events  
- native animations  
- native accessibility  

This enables React‑Native‑style apps with Terajs’s fine‑grained reactivity.

---

### **4.3 packages/renderer-canvas (Canvas/WebGL/Skia)**

Maps JSX to drawing instructions:

```tsx
<Rect x={10} y={20} width={100} height={50} fill="red" />
<Text x={20} y={40}>Hello</Text>
```

Renderer handles:

- Skia/WebGL drawing  
- z‑index layers  
- redraw scheduling  
- hit testing (optional)  

Used for:

- dashboards  
- charts  
- games  
- custom UI systems  

---

### **4.4 packages/renderer-ssr (SSR)**

Implements:

- string output  
- streaming chunks  
- hydration markers  
- serialization of loader data  

No DOM operations occur on the server.

---

### **4.5 packages/renderer-terminal (future)**

Maps JSX to terminal UI:

```tsx
<Box>
  <Text>Hello</Text>
</Box>
```

Renderer handles:

- ANSI codes  
- layout  
- input events  

---

## 5. Portal Support

Renderers must support a `<Portal>` primitive:

```ts
portal(target: any, node: Node): void
```

Examples:

- DOM → mount to `document.body`
- Native → mount to overlay layer
- Canvas → draw in higher z‑index layer
- Server → inline render

Portals enable modals, popovers, tooltips, dropdowns, and overlays.

---

## 6. Hydration

Renderers must support hydration:

- attach to existing nodes  
- skip creating nodes if they already exist  
- bind events  
- resume reactive updates  

Terajs Core ensures deterministic hydration.

---

## 7. Renderer Lifecycle

A renderer goes through:

### **1. Initialization**
- create root container  
- prepare environment  

### **2. Mount**
- create nodes  
- insert into container  

### **3. Update**
- reactive updates  
- property changes  
- event updates  

### **4. Unmount**
- remove nodes  
- cleanup events  
- cleanup effects  

---

## 8. Custom Renderers

Terajs allows developers to create custom renderers:

```ts
import { createRenderer } from "@terajs/renderer";

export const myRenderer = createRenderer({
  createElement,
  createText,
  insert,
  remove,
  setProp,
  addEvent,
});
```

Use cases:

- game engines  
- embedded devices  
- robotics dashboards  
- VR/AR interfaces  
- custom UI systems  

Terajs Core does not assume a DOM.

---

## 9. Performance Guarantees

Terajs’s fine‑grained reactivity ensures:

- no VDOM  
- no diffing  
- no re‑rendering components  
- minimal updates  
- direct node mutations  
- stable performance across renderers  

This makes Terajs ideal for:

- doom‑scroll feeds  
- ecommerce product grids  
- dashboards  
- native apps  
- canvas‑based UIs  

---

## 10. Philosophy Summary

Terajs’s renderer architecture is:

- simple  
- predictable  
- platform‑agnostic  
- high‑performance  
- flexible  
- future‑proof  

Terajs Core handles reactivity and components.  
Renderers handle output.  
Terajs Kit provides structure.

Together, they form a complete, scalable UI ecosystem.
```