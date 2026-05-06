#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const distRoot = resolve(repoRoot, "benchmarks", ".dist", "frameworks-browser");
const host = process.env.TERAJS_BROWSER_BENCH_HOST ?? "127.0.0.1";
const port = Number(process.env.TERAJS_BROWSER_BENCH_PORT ?? 4181);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error("[bench:browser:serve] TERAJS_BROWSER_BENCH_PORT must be a valid TCP port.");
  process.exit(1);
}

if (!existsSync(distRoot)) {
  console.error("[bench:browser:serve] Missing browser benchmark build output.");
  console.error("[bench:browser:serve] Run `npm run bench:browser:build` first.");
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
      body { margin: 0; padding: 40px 24px; background: #f4f7fb; color: #142033; }
      main { max-width: 860px; margin: 0 auto; background: white; border: 1px solid rgba(20,32,51,0.08); border-radius: 20px; padding: 28px 32px; box-shadow: 0 20px 60px rgba(10,18,30,0.08); }
      h1 { margin: 0 0 12px; font-size: 32px; }
      p { line-height: 1.6; color: #4f5f79; }
      ul { padding-left: 20px; }
      li + li { margin-top: 10px; }
      a { color: #2257d7; font-weight: 600; text-decoration: none; }
      code { font-family: Consolas, monospace; }
    </style>
  </head>
  <body>
    <main>
      <h1>Terajs Browser Benchmarks</h1>
      <p>These pages run the production browser benchmark harnesses that back the public performance story. Open either page directly and wait for the in-page table to complete.</p>
      <ul>
        <li><a href="/benchmarks/frameworks-browser.html">Framework benchmark</a> <code>/benchmarks/frameworks-browser.html</code></li>
        <li><a href="/benchmarks/route-startup-browser.html">Route startup benchmark</a> <code>/benchmarks/route-startup-browser.html</code></li>
      </ul>
    </main>
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