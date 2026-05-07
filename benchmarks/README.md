# Terajs Benchmarks

This subproject owns benchmark-only dependencies and runner scripts for the Terajs benchmark harnesses.
Framework comparison packages stay here so the Terajs root manifest stays focused on framework development rather than benchmark tooling.

## Install

```bash
cd benchmarks
npm install
```

## Browser Benchmarks

Build and serve the production browser benchmark pages:

```bash
npm run browser
```

Or run the steps separately:

```bash
npm run browser:build
npm run browser:serve
```

The served pages are:

- `http://127.0.0.1:4181/` combined browser benchmark shell that runs both suites sequentially and renders one merged results table
- `http://127.0.0.1:4181/benchmarks/frameworks-browser.html`
- `http://127.0.0.1:4181/benchmarks/route-startup-browser.html`

## Node Benchmarks

Optional local benchmark runners that use `jsdom` stay in this subproject as well:

```bash
npm run frameworks
npm run direct-text
```

## Notes

- Browser benchmark source files live in `frameworks-browser.ts` and `route-startup-browser.ts`.
- Runner scripts live in `scripts/`.
- The benchmark TypeScript config extends the repo root config so the harness can resolve `@terajs/*` packages from the repository without moving those dependencies into the root manifest.