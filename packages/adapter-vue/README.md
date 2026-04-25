# @terajs/adapter-vue

Vue interoperability adapter for mounting Terajs components inside Vue applications.

This package exists for real mixed-stack integration without turning the Terajs core into a Vue-shaped architecture.

## Installation

```bash
npm install @terajs/adapter-vue @terajs/runtime @terajs/renderer-web @terajs/reactivity vue
```

## Primary surface

- `TerajsDirective`: Vue directive for declarative mounting
- `mountTerajs()`: programmatic mount helper
- `useTerajsResource(resource)`: Vue composable bridge for Terajs resources
- `injectTerajsResource(resource)`: alias for dependency-injection-oriented naming

## Usage

Directive mode:

```ts
import { createApp } from "vue";
import { TerajsDirective } from "@terajs/adapter-vue";
import Counter from "./Counter.tera";

const app = createApp({
  data: () => ({
    binding: {
      component: Counter,
      props: { initialCount: 1 }
    }
  }),
  template: `<div v-terajs="binding" />`
});

app.directive("terajs", TerajsDirective);
app.mount("#app");
```

Programmatic mode:

```ts
import { mountTerajs } from "@terajs/adapter-vue";
import Counter from "./Counter.tera";

const root = document.getElementById("app")!;
const dispose = mountTerajs(root, Counter, { initialCount: 1 });

// Later
// dispose();
```

## Bridging Terajs resources into Vue

```ts
import { useTerajsResource } from "@terajs/adapter-vue";
import { createResource } from "@terajs/runtime";

const profileResource = createResource(async () => ({ name: "Ada" }));

export default {
  setup() {
    const profile = useTerajsResource(profileResource);

    return {
      profile,
      refresh: () => profile.refetch()
    };
  }
};
```

## Notes

- This adapter currently targets client-side mounting.
- Use adapters at integration seams while keeping runtime contracts Terajs-native.
- For full Terajs apps, prefer `@terajs/app` as the main entrypoint and keep Vue integration boundary-owned.
