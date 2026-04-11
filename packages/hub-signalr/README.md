# @terajs/hub-signalr

SignalR transport adapter for Terajs sync hub workflows.

## Status

- This is the first-party realtime adapter shipped for the current RC slice.
- `socket.io` and `websockets` adapter paths use the same runtime transport contract and are planned as separate adapters.

## Install

```bash
npm install @terajs/hub-signalr @microsoft/signalr
```

## Usage

```ts
import { createSignalRHubTransport } from "@terajs/hub-signalr";
import { invalidateResources, setServerFunctionTransport } from "@terajs/runtime";

const hub = await createSignalRHubTransport({
  url: "https://api.example.com/chat-hub",
  autoConnect: true,
  retryPolicy: "exponential"
});

hub.subscribe((message) => {
  if (message.type === "invalidate") {
    void invalidateResources(message.keys);
  }
});

setServerFunctionTransport(hub);
```

The adapter emits `hub:*` debug events for devtools and diagnostics.
