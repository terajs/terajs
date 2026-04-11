# @terajs/ui

UI-layer package reserved for shared Terajs UI primitives.

Status: pre-release scaffold package. The stable UI surface is intentionally minimal while core runtime, renderer, and routing contracts are finalized.

## Install

```bash
npm install @terajs/ui
```

## Scope

- Hosts framework-level UI primitives as they become stable.
- Depends on runtime and shared contracts.
- Avoids coupling to adapter-specific behavior.

## Notes

- For current production-ready web primitives, use `@terajs/renderer-web`.
- For dev overlay components, use `@terajs/devtools`.
