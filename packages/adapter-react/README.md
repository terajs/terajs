# @terajs/adapter-react

React interoperability adapter for mounting Terajs components inside React trees.

## Installation

```bash
npm install @terajs/adapter-react @terajs/runtime @terajs/renderer-web @terajs/reactivity react react-dom
```

## Usage

```tsx
import { TerajsWrapper } from "@terajs/adapter-react";
import Counter from "./Counter.tera";

export function App() {
  return (
    <TerajsWrapper
      component={Counter}
      props={{
        initialCount: 1,
        label: "Clicks"
      }}
    />
  );
}
```

## API

- `TerajsWrapper`: React component that mounts and unmounts a Terajs component.
- `TerajsWrapperProps.component`: Terajs component to render.
- `TerajsWrapperProps.props`: Optional props forwarded as Terajs signals.
- `useTerajsResource(resource)`: React hook bridge for reading Terajs resource state and calling `mutate`/`refetch`.

## Auto-Bridge Resource Hook

```tsx
import { useTerajsResource } from "@terajs/adapter-react";
import { createResource } from "@terajs/runtime";

const profileResource = createResource(async () => ({ name: "Ada" }));

function ProfileCard() {
  const profile = useTerajsResource(profileResource);

  if (profile.loading) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <p>Name: {profile.data?.name}</p>
      <button onClick={() => profile.refetch()}>Refresh</button>
    </div>
  );
}
```

## Notes

- This adapter currently targets client-side mounting.
- Keep wrapper usage focused on integration boundaries while core app logic stays Terajs-native.
