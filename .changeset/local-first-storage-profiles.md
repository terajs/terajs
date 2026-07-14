---
"@terajs/runtime": minor
"@terajs/app": minor
---

Add adaptive local-first storage profiles, metadata-aware persistence adapters and buckets, memory/IndexedDB/forbidden persistence adapters, durable serialized bucket manifests, and bucket primitives for app-owned large payload storage. Policies preserve adapter and bucket metadata at wrapped storage boundaries, resources use app-selected persistence adapters on every platform and return failed mutation outcomes when persistence or queueing fails, fetchers receive `AbortSignal`, and serialized mutation queue flushes expose reactive sync state plus idempotency context to delivery handlers. OPFS buckets now require persistent manifest storage for recoverable listing and metadata.
