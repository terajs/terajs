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

## Browser Regression Guard

Capture the latest production browser results into an ignored artifact file:

```bash
npm run browser:run
```

Compare the latest captured results against the checked-in baseline snapshot:

```bash
npm run browser:compare
```

Run the full guard end to end:

```bash
npm run browser:guard
```

The guard treats these metrics as release-blocking regression surfaces for Terajs:

- framework targeted median
- framework bulk median
- route swap median

Initial mount and route startup are still captured and reported, but they warn before they fail so the native-renderer refactor can protect the strongest current speed story first.

If the auto-detected system browser is not the one you want, set `TERAJS_BROWSER_BENCH_EXECUTABLE` to an explicit Chromium, Chrome, or Edge executable path.

## Node Benchmarks

Optional local benchmark runners that use `jsdom` stay in this subproject as well:

```bash
npm run frameworks
npm run direct-text
```

## Notes

- Browser benchmark source files live in `frameworks-browser.ts` and `route-startup-browser.ts`.
- Runner scripts live in `scripts/`.
- Production browser baselines live in `baselines/production-browser-baseline.json`.
- Latest benchmark captures are written to `.dist/latest-browser-bench.json`.
- The benchmark TypeScript config extends the repo root config so the harness can resolve `@terajs/*` packages from the repository without moving those dependencies into the root manifest.
