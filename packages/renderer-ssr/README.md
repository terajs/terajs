# @terajs/renderer-ssr

Server-side rendering package for Terajs.

Provides string and stream rendering helpers plus route execution helpers for SSR workflows.

## Install

```bash
npm install @terajs/renderer-ssr
```

## Core APIs

- `renderToString(component, context)`
- `renderToStream(component, context)`
- `executeServerRoute(options)`

## Notes

- Pair with `@terajs/router` for route definitions and route loading contracts.
- Keep request/response transport logic in adapter layers where possible.
