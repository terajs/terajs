#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const benchmarksRoot = resolve(scriptDir, "..");
const distRoot = resolve(benchmarksRoot, ".dist", "frameworks-browser");
const host = process.env.TERAJS_BROWSER_BENCH_HOST ?? "127.0.0.1";
const port = Number(process.env.TERAJS_BROWSER_BENCH_PORT ?? 4181);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error("[bench:browser:serve] TERAJS_BROWSER_BENCH_PORT must be a valid TCP port.");
  process.exit(1);
}

if (!existsSync(distRoot)) {
  console.error("[bench:browser:serve] Missing browser benchmark build output.");
  console.error("[bench:browser:serve] Run `npm run browser:build` first.");
  process.exit(1);
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

function renderIndexPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Terajs Browser Benchmarks</title>
    <style>
      :root { color-scheme: light; font-family: "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px 20px 40px;
        background:
          radial-gradient(circle at top left, rgba(34, 87, 215, 0.14), transparent 28%),
          linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%);
        color: #142033;
      }
      main {
        max-width: 1380px;
        margin: 0 auto;
        display: grid;
        gap: 20px;
      }
      .hero,
      .viewer {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(20, 32, 51, 0.08);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(10, 18, 30, 0.08);
      }
      .hero {
        padding: 28px 32px;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 32px;
        line-height: 1.1;
      }
      p {
        margin: 0;
        line-height: 1.6;
        color: #4f5f79;
      }
      .meta {
        margin-top: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .pill {
        padding: 8px 12px;
        border-radius: 999px;
        background: #eef4ff;
        color: #244177;
        font-size: 13px;
        font-weight: 600;
      }
      .viewer-header {
        padding: 18px 20px 14px;
        border-bottom: 1px solid rgba(20, 32, 51, 0.08);
      }
      h2 {
        margin: 0 0 6px;
        font-size: 18px;
      }
      .viewer-header p {
        font-size: 14px;
      }
      .viewer-links,
      .viewer-meta {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .viewer-meta {
        margin-top: 14px;
      }
      .status-pill {
        padding: 8px 12px;
        border-radius: 999px;
        background: #eef4ff;
        color: #244177;
        font-size: 13px;
        font-weight: 600;
      }
      .status-pill.error {
        background: #fff0ef;
        color: #b42318;
      }
      a {
        color: #2257d7;
        font-weight: 600;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      table {
        width: calc(100% - 40px);
        margin: 0 20px 20px;
        border-collapse: collapse;
        font-size: 14px;
      }
      th,
      td {
        padding: 12px 14px;
        border-bottom: 1px solid rgba(20, 32, 51, 0.08);
        text-align: left;
        vertical-align: top;
      }
      th {
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #6b7891;
      }
      td:first-child,
      th:first-child {
        padding-left: 0;
      }
      td:last-child,
      th:last-child {
        padding-right: 0;
      }
      .suite-heading {
        display: block;
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #6b7891;
        margin-bottom: 4px;
      }
      code {
        font-family: Consolas, monospace;
      }
      .notes {
        padding: 0 20px 24px;
        color: #526079;
      }
      .notes p + p {
        margin-top: 10px;
      }
      #runner {
        position: fixed;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
        inset: 0;
        border: 0;
      }
      @media (max-width: 1100px) {
        table {
          display: block;
          overflow-x: auto;
          white-space: nowrap;
        }
      }
      @media (max-width: 720px) {
        body {
          padding: 20px 12px 28px;
        }
        .hero {
          padding: 22px 20px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Terajs Browser Benchmarks</h1>
        <p>This page runs the production browser benchmark suites sequentially and merges the results into one table, so you can compare list and route metrics together without the suites interfering with each other.</p>
        <div class="meta">
          <span class="pill">Same server</span>
          <span class="pill">Sequential execution</span>
          <span class="pill">One combined table</span>
          <span class="pill">Production bundles only</span>
        </div>
      </section>
      <section class="viewer" aria-live="polite">
        <div class="viewer-header">
          <h2>Combined Browser Results</h2>
          <p>Framework DOM and route startup metrics are collected from the same benchmark set, but each suite runs in isolation before this table is updated.</p>
          <div class="viewer-links">
            <a href="/benchmarks/frameworks-browser.html" target="_blank" rel="noreferrer">Open framework standalone page</a>
            <a href="/benchmarks/route-startup-browser.html" target="_blank" rel="noreferrer">Open route standalone page</a>
          </div>
          <div class="viewer-meta">
            <span class="status-pill" id="status-pill">Running framework suite…</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Framework</th>
              <th><span class="suite-heading">Framework DOM</span>Mount Median</th>
              <th><span class="suite-heading">Framework DOM</span>Targeted Median</th>
              <th><span class="suite-heading">Framework DOM</span>Targeted Per Update</th>
              <th><span class="suite-heading">Framework DOM</span>Bulk Median</th>
              <th><span class="suite-heading">Framework DOM</span>Bulk Per Update</th>
              <th><span class="suite-heading">Route Startup</span>Startup Median</th>
              <th><span class="suite-heading">Route Startup</span>Startup Mean</th>
              <th><span class="suite-heading">Route Startup</span>Route Swap Median</th>
              <th><span class="suite-heading">Route Startup</span>Swap Per Transition</th>
            </tr>
          </thead>
          <tbody id="results-body"></tbody>
        </table>
        <section class="notes" id="notes">
          <p>Preparing combined results…</p>
        </section>
      </section>
      <iframe id="runner" title="Benchmark runner" aria-hidden="true"></iframe>
    </main>
    <script>
      const frameworkOrder = ['Terajs', 'Solid', 'Preact', 'Lit', 'Vue Vapor', 'React'];
      const runner = document.getElementById('runner');
      const resultsBody = document.getElementById('results-body');
      const notes = document.getElementById('notes');
      const statusPill = document.getElementById('status-pill');

      const suites = [
        {
          label: 'framework suite',
          url: '/benchmarks/frameworks-browser.html',
          stateKey: '__TERAJS_BROWSER_BENCH__',
          merge(entry, target) {
            target.mountMedianMs = entry.mountMedianMs;
            target.targetedMedianMs = entry.targetedMedianMs;
            target.targetedUsPerUpdate = entry.targetedUsPerUpdate;
            target.bulkMedianMs = entry.bulkMedianMs;
            target.bulkUsPerUpdate = entry.bulkUsPerUpdate;
          }
        },
        {
          label: 'route suite',
          url: '/benchmarks/route-startup-browser.html',
          stateKey: '__TERAJS_ROUTE_BROWSER_BENCH__',
          merge(entry, target) {
            target.startupMedianMs = entry.startupMedianMs;
            target.startupMeanMs = entry.startupMeanMs;
            target.navigationMedianMs = entry.navigationMedianMs;
            target.navigationUsPerTransition = entry.navigationUsPerTransition;
          }
        }
      ];

      function formatMs(value) {
        return typeof value === 'number' ? value.toFixed(2) + ' ms' : '—';
      }

      function formatUs(value) {
        return typeof value === 'number' ? value.toFixed(1) + ' us' : '—';
      }

      function renderCombinedTable(combined) {
        const rows = frameworkOrder
          .filter((framework) => combined.has(framework))
          .map((framework) => {
            const entry = combined.get(framework);
            return '<tr>' +
              '<td>' + framework + '</td>' +
              '<td>' + formatMs(entry.mountMedianMs) + '</td>' +
              '<td>' + formatMs(entry.targetedMedianMs) + '</td>' +
              '<td>' + formatUs(entry.targetedUsPerUpdate) + '</td>' +
              '<td>' + formatMs(entry.bulkMedianMs) + '</td>' +
              '<td>' + formatUs(entry.bulkUsPerUpdate) + '</td>' +
              '<td>' + formatMs(entry.startupMedianMs) + '</td>' +
              '<td>' + formatMs(entry.startupMeanMs) + '</td>' +
              '<td>' + formatMs(entry.navigationMedianMs) + '</td>' +
              '<td>' + formatUs(entry.navigationUsPerTransition) + '</td>' +
              '</tr>';
          })
          .join('');

        resultsBody.innerHTML = rows;
      }

      function renderNotes(combined) {
        const terajs = combined.get('Terajs');
        if (!terajs) {
          notes.innerHTML = '<p>Preparing combined results…</p>';
          return;
        }

        notes.innerHTML = frameworkOrder
          .filter((framework) => combined.has(framework))
          .map((framework) => {
            const entry = combined.get(framework);
            const parts = [];

            if (typeof entry.mountMedianMs === 'number' && typeof terajs.mountMedianMs === 'number') {
              parts.push('mount ' + (entry.mountMedianMs / terajs.mountMedianMs).toFixed(2) + 'x');
            }
            if (typeof entry.targetedMedianMs === 'number' && typeof terajs.targetedMedianMs === 'number') {
              parts.push('targeted ' + (entry.targetedMedianMs / terajs.targetedMedianMs).toFixed(2) + 'x');
            }
            if (typeof entry.bulkMedianMs === 'number' && typeof terajs.bulkMedianMs === 'number') {
              parts.push('bulk ' + (entry.bulkMedianMs / terajs.bulkMedianMs).toFixed(2) + 'x');
            }
            if (typeof entry.startupMedianMs === 'number' && typeof terajs.startupMedianMs === 'number') {
              parts.push('startup ' + (entry.startupMedianMs / terajs.startupMedianMs).toFixed(2) + 'x');
            }
            if (typeof entry.navigationMedianMs === 'number' && typeof terajs.navigationMedianMs === 'number') {
              parts.push('route swap ' + (entry.navigationMedianMs / terajs.navigationMedianMs).toFixed(2) + 'x');
            }

            return '<p><code>' + framework + '</code>: ' + parts.join(', ') + ' relative to Terajs.</p>';
          })
          .join('');
      }

      function setStatus(message, isError) {
        statusPill.textContent = message;
        statusPill.classList.toggle('error', Boolean(isError));
      }

      function waitForResults(stateKey) {
        return new Promise((resolve, reject) => {
          const startedAt = performance.now();

          function check() {
            try {
              const state = runner.contentWindow && runner.contentWindow[stateKey];
              if (!state || state.status === 'running') {
                if (performance.now() - startedAt > 300000) {
                  reject(new Error('Timed out waiting for benchmark results.'));
                  return;
                }
                window.setTimeout(check, 100);
                return;
              }

              if (state.status === 'error') {
                reject(new Error(state.error || 'Benchmark failed.'));
                return;
              }

              resolve(Array.isArray(state.results) ? state.results : []);
            } catch (error) {
              reject(error);
            }
          }

          check();
        });
      }

      function loadSuite(suite) {
        return new Promise((resolve, reject) => {
          const separator = suite.url.includes('?') ? '&' : '?';
          const src = suite.url + separator + 'combined=1&ts=' + Date.now();

          runner.onload = () => {
            waitForResults(suite.stateKey).then(resolve, reject);
          };

          runner.onerror = () => {
            reject(new Error('Failed to load ' + suite.label + '.'));
          };

          runner.setAttribute('src', src);
        });
      }

      async function run() {
        const combined = new Map();

        try {
          for (const suite of suites) {
            setStatus('Running ' + suite.label + '…', false);
            const results = await loadSuite(suite);

            for (const entry of results) {
              const target = combined.get(entry.framework) || { framework: entry.framework };
              suite.merge(entry, target);
              combined.set(entry.framework, target);
            }

            renderCombinedTable(combined);
            renderNotes(combined);
          }

          setStatus('Complete. Combined table reflects sequential browser runs.', false);
          runner.setAttribute('src', 'about:blank');
        } catch (error) {
          setStatus('Failed. ' + (error && error.message ? error.message : String(error)), true);
          notes.innerHTML = '<p><code>' + String(error && error.message ? error.message : error) + '</code></p>';
        }
      }

      run();
    </script>
  </body>
</html>`;
}

const server = createServer((request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
    const pathname = requestUrl.pathname;

    if (pathname === "/" || pathname === "/index.html") {
      sendHtml(response, 200, renderIndexPage());
      return;
    }

    const filePath = resolve(distRoot, `.${pathname}`);
    if (!filePath.startsWith(distRoot)) {
      sendHtml(response, 403, "<h1>Forbidden</h1>");
      return;
    }

    if (!existsSync(filePath)) {
      sendHtml(response, 404, "<h1>Not Found</h1>");
      return;
    }

    const stats = statSync(filePath);
    const resolvedFile = stats.isDirectory() ? resolve(filePath, "index.html") : filePath;

    if (!existsSync(resolvedFile)) {
      sendHtml(response, 404, "<h1>Not Found</h1>");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(resolvedFile)] ?? "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(resolvedFile).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : String(error));
  }
});

server.listen(port, host, () => {
  console.log(`[bench:browser:serve] Serving browser benchmarks from ${distRoot}`);
  console.log(`[bench:browser:serve] Index: http://${host}:${port}/`);
  console.log(`[bench:browser:serve] Framework benchmark: http://${host}:${port}/benchmarks/frameworks-browser.html`);
  console.log(`[bench:browser:serve] Route startup benchmark: http://${host}:${port}/benchmarks/route-startup-browser.html`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}