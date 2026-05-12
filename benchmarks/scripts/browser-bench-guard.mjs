#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const benchmarksRoot = resolve(scriptDir, "..");
const baselinePath = resolve(benchmarksRoot, "baselines", "production-browser-baseline.json");
const latestResultPath = resolve(benchmarksRoot, ".dist", "latest-browser-bench.json");
const serverScriptPath = resolve(benchmarksRoot, "scripts", "serve-browser-bench.mjs");
const baseUrl = `http://${process.env.TERAJS_BROWSER_BENCH_HOST ?? "127.0.0.1"}:${process.env.TERAJS_BROWSER_BENCH_PORT ?? "4181"}`;
const benchmarkTimeoutMs = Number(process.env.TERAJS_BROWSER_BENCH_TIMEOUT_MS ?? 300000);

function round(value) {
  return Math.round(value * 100) / 100;
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

function getFrameworkEntry(entries, framework) {
  const entry = entries.find((candidate) => candidate.framework === framework);
  if (!entry) {
    throw new Error(`Missing benchmark entry for ${framework}.`);
  }
  return entry;
}

function pickBrowserExecutable() {
  const configured = process.env.TERAJS_BROWSER_BENCH_EXECUTABLE;
  if (configured && existsSync(configured)) {
    return configured;
  }

  const candidates = process.platform === "win32"
    ? [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      ]
    : process.platform === "darwin"
      ? [
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        ]
      : [
          "/usr/bin/microsoft-edge",
          "/usr/bin/microsoft-edge-stable",
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium"
        ];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("Unable to locate a browser executable for the browser benchmark guard.");
  }

  return found;
}

async function waitForServer() {
  const deadline = Date.now() + benchmarkTimeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { method: "GET" });
      if (response.ok) {
        return;
      }
    } catch {
      // server not ready yet
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }

  throw new Error(`Timed out waiting for browser benchmark server at ${baseUrl}.`);
}

function startServer() {
  const child = spawn(process.execPath, [serverScriptPath], {
    cwd: benchmarksRoot,
    env: process.env,
    stdio: ["ignore", "inherit", "inherit"]
  });

  child.on("error", (error) => {
    console.error("[bench:browser:guard] Failed to start benchmark server.", error);
  });

  return child;
}

async function runSuite(page, suite) {
  await page.goto(suite.url, { waitUntil: "load", timeout: benchmarkTimeoutMs });
  await page.waitForFunction(suite.check, undefined, { timeout: benchmarkTimeoutMs });
  const state = await page.evaluate(suite.read);

  if (!state || state.status !== "done" || !Array.isArray(state.results)) {
    const error = state?.error ? ` ${state.error}` : "";
    throw new Error(`Benchmark suite ${suite.label} did not complete successfully.${error}`);
  }

  return state.results;
}

async function captureBrowserBenchmarks() {
  const executablePath = pickBrowserExecutable();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: process.platform === "linux" ? ["--no-sandbox", "--disable-gpu"] : ["--disable-gpu"]
  });

  try {
    const page = await browser.newPage();
    const frameworkDom = await runSuite(page, {
      label: "framework browser benchmark",
      url: `${baseUrl}/benchmarks/frameworks-browser.html`,
      check: () => globalThis.__TERAJS_BROWSER_BENCH__?.status === "done" || globalThis.__TERAJS_BROWSER_BENCH__?.status === "error",
      read: () => globalThis.__TERAJS_BROWSER_BENCH__
    });
    const routeStartup = await runSuite(page, {
      label: "route startup browser benchmark",
      url: `${baseUrl}/benchmarks/route-startup-browser.html`,
      check: () => globalThis.__TERAJS_ROUTE_BROWSER_BENCH__?.status === "done" || globalThis.__TERAJS_ROUTE_BROWSER_BENCH__?.status === "error",
      read: () => globalThis.__TERAJS_ROUTE_BROWSER_BENCH__
    });

    return {
      capturedAt: new Date().toISOString(),
      source: "Automated production browser benchmark run",
      environment: {
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        browserExecutable: executablePath,
        baseUrl
      },
      frameworkDom: frameworkDom.map((entry) => ({
        framework: entry.framework,
        mountMedianMs: round(entry.mountMedianMs),
        mountMeanMs: round(entry.mountMeanMs),
        targetedMedianMs: round(entry.targetedMedianMs),
        targetedUsPerUpdate: round(entry.targetedUsPerUpdate),
        bulkMedianMs: round(entry.bulkMedianMs),
        bulkUsPerUpdate: round(entry.bulkUsPerUpdate)
      })),
      routeStartup: routeStartup.map((entry) => ({
        framework: entry.framework,
        startupMedianMs: round(entry.startupMedianMs),
        startupMeanMs: round(entry.startupMeanMs),
        navigationMedianMs: round(entry.navigationMedianMs),
        navigationUsPerTransition: round(entry.navigationUsPerTransition)
      }))
    };
  } finally {
    await browser.close();
  }
}

function compareToBaseline(current, baseline) {
  const baselineFramework = getFrameworkEntry(baseline.frameworkDom, "Terajs");
  const currentFramework = getFrameworkEntry(current.frameworkDom, "Terajs");
  const baselineRoute = getFrameworkEntry(baseline.routeStartup, "Terajs");
  const currentRoute = getFrameworkEntry(current.routeStartup, "Terajs");
  const failures = [];
  const warnings = [];

  const checks = [
    {
      bucket: failures,
      label: "targeted median",
      budget: baseline.budgets.fail.frameworkDom.targetedMedianMs,
      currentValue: currentFramework.targetedMedianMs,
      baselineValue: baselineFramework.targetedMedianMs
    },
    {
      bucket: failures,
      label: "bulk median",
      budget: baseline.budgets.fail.frameworkDom.bulkMedianMs,
      currentValue: currentFramework.bulkMedianMs,
      baselineValue: baselineFramework.bulkMedianMs
    },
    {
      bucket: failures,
      label: "route swap median",
      budget: baseline.budgets.fail.routeStartup.navigationMedianMs,
      currentValue: currentRoute.navigationMedianMs,
      baselineValue: baselineRoute.navigationMedianMs
    },
    {
      bucket: warnings,
      label: "mount median",
      budget: baseline.budgets.warn.frameworkDom.mountMedianMs,
      currentValue: currentFramework.mountMedianMs,
      baselineValue: baselineFramework.mountMedianMs
    },
    {
      bucket: warnings,
      label: "startup median",
      budget: baseline.budgets.warn.routeStartup.startupMedianMs,
      currentValue: currentRoute.startupMedianMs,
      baselineValue: baselineRoute.startupMedianMs
    }
  ];

  for (const check of checks) {
    const currentRatio = check.currentValue / check.baselineValue;
    if (currentRatio > check.budget) {
      check.bucket.push(
        `${check.label}: current ${formatMs(check.currentValue)} vs baseline ${formatMs(check.baselineValue)} (${currentRatio.toFixed(2)}x) exceeded ${check.bucket === failures ? "fail" : "warn"} budget ${check.budget.toFixed(2)}x`
      );
    }
  }

  return { failures, warnings };
}

async function main() {
  await mkdir(resolve(benchmarksRoot, ".dist"), { recursive: true });
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));

  const server = startServer();

  try {
    await waitForServer();
    const latest = await captureBrowserBenchmarks();
    await writeFile(latestResultPath, `${JSON.stringify(latest, null, 2)}\n`);

    const terajsFramework = getFrameworkEntry(latest.frameworkDom, "Terajs");
    const terajsRoute = getFrameworkEntry(latest.routeStartup, "Terajs");

    console.log("Terajs production browser benchmark snapshot");
    console.log(`- Mount median: ${formatMs(terajsFramework.mountMedianMs)}`);
    console.log(`- Targeted median: ${formatMs(terajsFramework.targetedMedianMs)}`);
    console.log(`- Bulk median: ${formatMs(terajsFramework.bulkMedianMs)}`);
    console.log(`- Startup median: ${formatMs(terajsRoute.startupMedianMs)}`);
    console.log(`- Route swap median: ${formatMs(terajsRoute.navigationMedianMs)}`);
    console.log(`Latest benchmark capture written to ${latestResultPath}`);
    console.log("Comparing Terajs browser results to the checked-in baseline");

    const comparison = compareToBaseline(latest, baseline);

    for (const warning of comparison.warnings) {
      console.warn(`- WARN ${warning}`);
    }

    for (const failure of comparison.failures) {
      console.error(`- FAIL ${failure}`);
    }

    if (comparison.failures.length > 0) {
      console.error("Browser benchmark guard failed.");
      process.exitCode = 1;
      return;
    }

    if (comparison.warnings.length > 0) {
      console.warn("Browser benchmark guard completed with warnings only.");
      return;
    }

    console.log("Browser benchmark guard passed.");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error("Browser benchmark guard failed.");
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});