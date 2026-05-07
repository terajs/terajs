# Terajs

Terajs is a compiler-native UI framework for route-first, local-first web applications.

It keeps `.tera` pages, `@terajs/app`, `@terajs/app/vite`, `@terajs/app/devtools`, realtime transports, and first-party DevTools in one web-first stack.

- Docs: https://terajs.com/docs
- Quickstart: https://terajs.com/docs/quickstart
- Benchmarks: https://terajs.com/docs/benchmarks
- Examples: https://terajs.com/examples
- API reference: https://terajs.com/api-reference
- VS Code extension: https://marketplace.visualstudio.com/items?itemName=Terajs.terajs-tera-language-tools

## Why Terajs

- Compiler-native rendering binds updates directly to DOM nodes instead of running a VDOM diff loop.
- Route-first application structure keeps pages, layouts, metadata, and middleware in one visible pipeline.
- Local-first runtime primitives keep actions, resources, invalidation, queues, retry policy, and conflict handling inside the framework.
- First-party SignalR, Socket.IO, and WebSockets adapters plug into one transport contract instead of forking the app model.
- DevTools and the VS Code bridge make router state, component state, queue state, and structured diagnostics inspectable on a live page.
- The core stays renderer-agnostic, while React and Vue wrappers stay at the integration seam.

## Start Here

Create a new app:

```bash
npm create terajs@latest my-app
cd my-app
npm install
npm run dev
```

That scaffold gives you the route-first Terajs surface around `@terajs/app`, `@terajs/app/vite`, `terajs.config.cjs`, `src/pages`, and `src/components`.

If you are evaluating the stack before installing anything, start with the docs and examples:

- Product docs: https://terajs.com/docs
- Guided quickstart: https://terajs.com/docs/quickstart
- Finished examples: https://terajs.com/examples
- Exact public APIs: https://terajs.com/api-reference

## Browser Benchmarks

The public performance story is based on production browser bundles in `benchmarks/frameworks-browser.ts` and `benchmarks/route-startup-browser.ts`. The framework DOM benchmark compares Terajs, Solid, Preact, Lit, Vue Vapor, and React on the same harness, while the route benchmark compares Terajs, Solid, Preact, Lit, Vue Vapor, and React.
Benchmark-only framework dependencies now live in the isolated `benchmarks/` subproject instead of the Terajs root manifest.

### Framework DOM benchmark

| Framework | Mount median | Targeted median | Targeted/update | Bulk median | Bulk/update |
| --- | --- | --- | --- | --- | --- |
| Terajs | `1.30 ms` | `1.20 ms` | `6.0 us` | `2.90 ms` | `145.0 us` |
| Solid | `0.90 ms` | `3.40 ms` | `17.0 us` | `4.60 ms` | `230.0 us` |
| Preact | `0.90 ms` | `63.20 ms` | `316.0 us` | `9.70 ms` | `485.0 us` |
| Lit | `1.80 ms` | `11.20 ms` | `56.0 us` | `4.50 ms` | `225.0 us` |
| Vue Vapor | `2.40 ms` | `83.20 ms` | `416.0 us` | `37.20 ms` | `1860.0 us` |
| React | `1.00 ms` | `25.80 ms` | `129.0 us` | `6.50 ms` | `325.0 us` |

### Route benchmark

| Framework | Startup median | Startup mean | Route swap median | Per transition |
| --- | --- | --- | --- | --- |
| Terajs | `0.50 ms` | `0.53 ms` | `5.40 ms` | `90.0 us` |
| Solid | `0.20 ms` | `0.20 ms` | `11.50 ms` | `191.7 us` |
| Preact | `0.40 ms` | `0.39 ms` | `7.60 ms` | `126.7 us` |
| Lit | `0.40 ms` | `0.41 ms` | `3.10 ms` | `51.7 us` |
| Vue Vapor | `0.30 ms` | `0.35 ms` | `10.30 ms` | `171.7 us` |
| React | `0.40 ms` | `0.42 ms` | `6.70 ms` | `111.7 us` |

Treat those numbers as workload-specific receipts, not a blanket claim that every Terajs app beats every other framework on every screen.

Read the benchmark guide on the public site for the full interpretation and comparison context: https://terajs.com/docs/benchmarks

### Rerun the public harness

```bash
cd benchmarks
npm install
npm run browser
```

That command builds the bundle and serves:

- `http://127.0.0.1:4181/` shared browser benchmark shell with one merged results table
- `http://127.0.0.1:4181/benchmarks/frameworks-browser.html`
- `http://127.0.0.1:4181/benchmarks/route-startup-browser.html`

You can also split the steps:

```bash
cd benchmarks
npm run browser:build
npm run browser:serve
```

## Documentation Map

- Docs overview: https://terajs.com/docs
- Quickstart: https://terajs.com/docs/quickstart
- Benchmarks: https://terajs.com/docs/benchmarks
- Examples: https://terajs.com/examples
- API reference: https://terajs.com/api-reference
- Repo changelog: `CHANGELOG.md`
- Repo API file: `API_REFERENCE.md`
- Long-range direction: `VISION.md`
