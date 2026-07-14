---
"@terajs/runtime": minor
"@terajs/app": minor
---

Add adaptive local-first storage profiles, metadata-aware persistence adapters and buckets, memory/IndexedDB/forbidden persistence adapters, durable bucket manifests, and bucket primitives for app-owned large payload storage. Policies now wrap adapters/buckets at the storage boundary, resources can use app-selected persistence adapters and return mutation outcomes, fetchers receive `AbortSignal`, and mutation queues expose reactive sync state while preserving idempotency keys.
