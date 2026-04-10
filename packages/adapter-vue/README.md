# @terajs/adapter-vue

Vue interoperability adapter for mounting Terajs components inside Vue applications.

## Installation

```bash
npm install @terajs/adapter-vue @terajs/runtime @terajs/renderer-web @terajs/reactivity vue
```

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

## API

- `TerajsDirective`: Vue directive that mounts and updates a Terajs component.
- `mountTerajs`: programmatic mount helper returning a disposer.
- `TerajsVueBinding`: binding payload shape for directive usage.
- `useTerajsResource(resource)`: Vue composable bridge for reading Terajs resource state and calling `mutate`/`refetch`.
- `injectTerajsResource(resource)`: alias of `useTerajsResource` for dependency-injection style naming.

## Auto-Bridge Resource Composable

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
