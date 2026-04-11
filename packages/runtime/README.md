# Terajs Runtime

The Terajs runtime coordinates component lifecycle, context, async data primitives,
local-first queue contracts, and server-function boundaries.

---

## Features
- Platform-agnostic: works in browser, SSR, and custom renderers
- Context system for dependency injection
- Lifecycle hooks for mount/update/unmount orchestration
- Action/resource primitives with queue-aware execution paths
- Validation and invalidation helpers for route and form workflows
- Server function execution and transport adapters

---

## Install

```bash
npm install @terajs/runtime
```

---

## Usage Example

```ts
import { createAction, createMutationQueue } from '@terajs/runtime';

const queue = await createMutationQueue();

const saveProfile = createAction(async (payload: { name: string }) => {
	return payload.name;
});

await saveProfile.runQueued({ queue, type: 'profile:save' }, { name: 'Ada' });
```

---

## Context API

```ts
import { createComponentContext, getCurrentContext, setCurrentContext } from '@terajs/runtime';

const ctx = createComponentContext();
setCurrentContext(ctx);
```

---

## DevTools Integration
- All runtime events are streamed to the devtools overlay for live inspection.

---

## Realtime Transport Adapters

`@terajs/runtime` exposes a transport contract so apps can integrate any realtime stack (SignalR, Socket.IO, raw WebSockets, custom RPC).

```ts
import { setServerFunctionTransport, type ServerFunctionCall, type ServerFunctionTransport } from "@terajs/runtime";
import { Debug } from "@terajs/shared";

const transport: ServerFunctionTransport = {
	async invoke(call: ServerFunctionCall) {
		Debug.emit("hub:sync:start", {
			transport: "socket.io",
			call: call.id
		});

		const result = await invokeOverSocket(call);

		Debug.emit("hub:sync:complete", {
			transport: "socket.io",
			call: call.id
		});

		return result;
	}
};

setServerFunctionTransport(transport);
```

Recommended debug events for first-class DevTools visibility:

- `hub:connect`
- `hub:disconnect`
- `hub:error`
- `hub:push:received`
- `hub:sync:start`
- `hub:sync:complete`

---

## API Reference
- Components: `component`, `onCleanup`, lifecycle hooks
- Context: `provide`, `inject`, `createComponentContext`
- Async data: `createAction`, `createResource`
- Local-first queue: `createMutationQueue`, `createMutationQueueStorage`
- Validation: `createSchemaValidator`
- Server functions: `server`, `executeServerFunction`, transport helpers

---

See API_REFERENCE.md at repository root for the canonical shipped surface.

