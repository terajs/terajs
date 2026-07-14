---
"@terajs/runtime": minor
"@terajs/app": minor
---

Add adaptive local-first storage profiles, metadata-aware persistence adapters and buckets, memory/IndexedDB/forbidden persistence adapters, durable atomic bucket manifests, and bucket primitives for app-owned large payload storage. Policies preserve adapter, atomic-update capabilities, and bucket metadata at wrapped storage boundaries. Resources use app-selected persistence adapters on every platform, reject stale cache hydration, and return failed mutation outcomes when persistence or queueing fails. Fetchers receive `AbortSignal`. Mutation queues serialize every state-changing persistence operation, fail closed when hydration fails, expose reactive sync state, and pass idempotency context to delivery handlers. OPFS buckets require durable atomic manifest storage for recoverable listing and metadata across reloads and concurrent contexts.
