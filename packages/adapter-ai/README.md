# @terajs/adapter-ai

AI-facing helper package for Terajs.

This package provides structured action-schema helpers and sanitized reactive-state snapshots for tooling, assistants, and other AI-adjacent integrations.

It also provides a higher-level chatbot helper for app teams that want a simple request pipeline without giving up safe defaults.

## Install

```bash
npm install @terajs/adapter-ai
```

## What it exports

- `defineAIActions(schema)` for declaring a typed action schema with built-in validation
- `captureStateSnapshot(signals?)` for exporting a sanitized snapshot of active Terajs signals
- `createAIChatbot(options)` for wiring a chatbot client with same-origin defaults and explicit external opt-in
- `AIActionsSchema` and `AIActionsDefinition` types for action-schema authoring
- `AIStateSnapshot` for structured state export consumers

## Minimal example

```ts
import { createAIChatbot, defineAIActions } from "@terajs/adapter-ai";

const actions = defineAIActions({
  openIssue: {
    description: "Create a project issue",
    params: {
      title: { type: "string", required: true },
      priority: { type: "string" }
    }
  }
});

const chatbot = createAIChatbot({
  endpoint: "/api/chat",
  actions,
  includeStateSnapshot: true,
  signals: []
});

const request = chatbot.buildRequest("Help this shopper find a gift", {
  metadata: {
    route: "/products",
    signedIn: true
  }
});

const response = await chatbot.sendMessage("Help this shopper find a gift");
```

## Notes

- `captureStateSnapshot(...)` filters sensitive keys such as password, token, credential, and API-key style fields instead of serializing them blindly.
- Snapshot output is normalized for tooling consumption and avoids leaking raw non-serializable values.
- `createAIChatbot(...)` only sends state when you explicitly opt in with `includeStateSnapshot: true` and provide signals.
- Absolute external endpoints are blocked by default; set `allowExternalEndpoint: true` if you intentionally want to call an external AI service.
- External endpoint opt-in omits ambient credentials instead of forwarding cookies by default.
- This package complements Terajs metadata and DevTools workflows; it is not a model-provider SDK.