#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const VALID_MODES = new Set(["run", "compare", "guard"]);
const mode = process.argv[2] ?? "guard";

if (!VALID_MODES.has(mode)) {
  console.error(`[bench:browser] Unsupported mode '${mode}'. Use run, compare, or guard.`);
  process.exit(1);
}

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const benchmarksRoot = resolve(scriptDir, "..");
const baselinePath = resolve(benchmarksRoot, "baselines", "production-browser-baseline.json");
const latestResultPath = resolve(benchmarksRoot, ".dist", "latest-browser-bench.json");
const distRoot = resolve(benchmarksRoot, ".dist", "frameworks-browser");
const host = process.env.TERAJS_BROWSER_BENCH_HOST ?? "127.0.0.1";
const port = Number(process.env.TERAJS_BROWSER_BENCH_PORT ?? 4181);
const baseUrl = `http://${host}:${port}`;
const benchmarkTimeoutMs = Number(process.env.TERAJS_BROWSER_BENCH_TIMEOUT_MS ?? 300000);

function ensureBuildOutput() {
  if (!existsSync(distRoot)) {
    throw new Error("Missing browser benchmark build output. Run `npm run browser:build` first.");
  }
}

function readJson(jsonPath) {
  return JSON.parse(readFileSync(jsonPath, "utf8"));
}

function writeJson(jsonPath, data) {
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

function formatRatio(value) {
  return `${value.toFixed(2)}x`;
}

function getFrameworkEntry(entries, framework) {
  const entry = entries.find((candidate) => candidate.framework === framework);
  if (!entry) {
    throw new Error(`Missing benchmark entry for ${framework}.`);
  }
  return entry;
}

function getBudget(baseline, level, suiteName, metricName) {
  return baseline?.budgets?.[level]?.[suiteName]?.[metricName];
}

function summarizeTerajsResults(current) {
  const framework = getFrameworkEntry(current.frameworkDom, "Terajs");
  const route = getFrameworkEntry(current.routeStartup, "Terajs");

  console.log("Terajs production browser benchmark snapshot");
  console.log(`- Mount median: ${formatMs(framework.mountMedianMs)}`);
  console.log(`- Targeted median: ${formatMs(framework.targetedMedianMs)}`);
  console.log(`- Bulk median: ${formatMs(framework.bulkMedianMs)}`);
  console.log(`- Startup median: ${formatMs(route.startupMedianMs)}`);
  console.log(`- Route swap median: ${formatMs(route.navigationMedianMs)}`);
}

function compareResults(baseline, current) {
  const failures = [];
  const warnings = [];
  const baselineFramework = getFrameworkEntry(baseline.frameworkDom, "Terajs");
  const currentFramework = getFrameworkEntry(current.frameworkDom, "Terajs");
  const baselineRoute = getFrameworkEntry(baseline.routeStartup, "Terajs");
  const currentRoute = getFrameworkEntry(current.routeStartup, "Terajs");

  const comparisons = [
    {
      suite: "frameworkDom",
      metric: "mountMedianMs",
      label: "mount median",
      baselineValue: baselineFramework.mountMedianMs,
      currentValue: currentFramework.mountMedianMs
    },
    {
      suite: "frameworkDom",
      metric: "targetedMedianMs",
      label: "targeted median",
      baselineValue: baselineFramework.targetedMedianMs,
      currentValue: currentFramework.targetedMedianMs
    },
    {
      suite: "frameworkDom",
      metric: "bulkMedianMs",
      label: "bulk median",
      baselineValue: baselineFramework.bulkMedianMs,
      currentValue: currentFramework.bulkMedianMs
    },
    {
      suite: "routeStartup",
      metric: "startupMedianMs",
      label: "startup median",
      baselineValue: baselineRoute.startupMedianMs,
      currentValue: currentRoute.startupMedianMs
    },
    {
      suite: "routeStartup",
      metric: "navigationMedianMs",
      label: "route swap median",
      baselineValue: baselineRoute.navigationMedianMs,
      currentValue: currentRoute.navigationMedianMs
    }
  ];

  console.log("Comparing Terajs browser results to the checked-in baseline");
  for (const comparison of comparisons) {
    const ratio = comparison.currentValue / comparison.baselineValue;
    const failBudget = getBudget(baseline, "fail", comparison.suite, comparison.metric);
    const warnBudget = getBudget(baseline, "warn", comparison.suite, comparison.metric);
    const message = `${comparison.label}: current ${formatMs(comparison.currentValue)} vs baseline ${formatMs(comparison.baselineValue)} (${formatRatio(ratio)})`;

    if (typeof failBudget === "number" && ratio > failBudget) {
      failures.push(`${message} exceeded fail budget ${formatRatio(failBudget)}`);
      continue;
    }

    if (typeof warnBudget === "number" && ratio > warnBudget) {
      warnings.push(`${message} exceeded warn budget ${formatRatio(warnBudget)}`);
      continue;
    }

    console.log(`- PASS ${message}`);
  }

  return { failures, warnings };
}

function getBrowserCandidates() {
  const explicit = process.env.TERAJS_BROWSER_BENCH_EXECUTABLE;
  if (explicit) {
    return [explicit];
  }

  if (process.platform === "win32") {
    return [
      `${process.env.LOCALAPPDATA ?? ""}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env.PROGRAMFILES ?? ""}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env["PROGRAMFILES(X86)"] ?? ""}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env.LOCALAPPDATA ?? ""}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.PROGRAMFILES ?? ""}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env["PROGRAMFILES(X86)"] ?? ""}\\Google\\Chrome\\Application\\chrome.exe`
    ].filter(Boolean);
  }

  if (process.platform === "darwin") {
    return [
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    ];
  }

  return [
    "/usr/bin/microsoft-edge",
    "/usr/bin/microsoft-edge-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ];
}

function resolveBrowserExecutable() {
  for (const candidate of getBrowserCandidates()) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("No Chromium-compatible browser executable found. Set TERAJS_BROWSER_BENCH_EXECUTABLE to Chrome, Edge, or Chromium.");
}

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30000) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        return;
      }
    } catch {
      // server still starting
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for browser benchmark server at ${baseUrl}.`);
}

function startServer() {
  const child = spawn(process.execPath, [resolve(scriptDir, "serve-browser-bench.mjs")], {
    cwd: benchmarksRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  return child;
}

async function stopServer(child) {
  if (!child || child.killed) {
    return;
  }

  await new Promise((resolve) => {
    const finish = () => resolve();
    child.once("exit", finish);
    child.kill();
    setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
      resolve();
    }, 5000);
  });
}

async function runSuite(browser, suite) {
  const page = await browser.newPage();

  try {
    await page.goto(`${suite.url}?ts=${Date.now()}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      (stateKey) => {
        const state = globalThis[stateKey];
        return state && state.status && state.status !== "running";
      },
      suite.stateKey,
      { timeout: benchmarkTimeoutMs }
    );

    const state = await page.evaluate((stateKey) => globalThis[stateKey], suite.stateKey);
    if (!state) {
      throw new Error(`Missing benchmark state for ${suite.label}.`);
    }

    if (state.status === "error") {
      throw new Error(state.error || `${suite.label} failed.`);
    }

    return Array.isArray(state.results) ? state.results : [];
  } finally {
    await page.close();
  }
}

async function captureBrowserBenchmarks() {
  ensureBuildOutput();
  const server = startServer();

  try {
    await waitForServer();

    const executablePath = resolveBrowserExecutable();
    const browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ["--disable-dev-shm-usage"]
    });

    try {
      const frameworkDom = await runSuite(browser, {
        label: "framework browser benchmark",
        url: `${baseUrl}/benchmarks/frameworks-browser.html`,
        stateKey: "__TERAJS_BROWSER_BENCH__"
      });

      const routeStartup = await runSuite(browser, {
        label: "route startup browser benchmark",
        url: `${baseUrl}/benchmarks/route-startup-browser.html`,
        stateKey: "__TERAJS_ROUTE_BROWSER_BENCH__"
      });

      const latest = {
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
          ...entry,
          mountMedianMs: round(entry.mountMedianMs),
          mountMeanMs: round(entry.mountMeanMs),
          targetedMedianMs: round(entry.targetedMedianMs),
          targetedUsPerUpdate: round(entry.targetedUsPerUpdate),
          bulkMedianMs: round(entry.bulkMedianMs),
          bulkUsPerUpdate: round(entry.bulkUsPerUpdate)
        })),
        routeStartup: routeStartup.map((entry) => ({
          ...entry,
          startupMedianMs: round(entry.startupMedianMs),
          startupMeanMs: round(entry.startupMeanMs),
          navigationMedianMs: round(entry.navigationMedianMs),
          navigationUsPerTransition: round(entry.navigationUsPerTransition)
        }))
      };

      writeJson(latestResultPath, latest);
      summarizeTerajsResults(latest);
      console.log(`Latest benchmark capture written to ${latestResultPath}`);
      return latest;
    } finally {
      await browser.close();
    }
  } finally {
    await stopServer(server);
  }
}

async function runMode() {
  await captureBrowserBenchmarks();
}

async function compareMode(current = undefined) {
  if (!existsSync(latestResultPath) && !current) {
    throw new Error("Missing latest benchmark capture. Run `npm run browser:run` first.");
  }

  const baseline = readJson(baselinePath);
  const latest = current ?? readJson(latestResultPath);
  const { failures, warnings } = compareResults(baseline, latest);

  for (const warning of warnings) {
    console.warn(`- WARN ${warning}`);
  }

  for (const failure of failures) {
    console.error(`- FAIL ${failure}`);
  }

  if (failures.length > 0) {
    process.exitCode = 1;
    return;
  }

  if (warnings.length > 0) {
    console.warn("Browser benchmark guard completed with warnings only.");
    return;
  }

  console.log("Browser benchmark guard passed.");
}

async function guardMode() {
  const latest = await captureBrowserBenchmarks();
  await compareMode(latest);
}

async function main() {
  if (mode === "run") {
    await runMode();
    return;
  }

  if (mode === "compare") {
    await compareMode();
    return;
  }

  await guardMode();
}

main().catch((error) => {
  console.error("Browser benchmark guard failed.");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});