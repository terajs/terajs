import { mount, renderIRModuleToFragment, unmount } from "@terajs/renderer-web";
import { signal } from "@terajs/reactivity";
import { parseSFC, compileTemplateFromSFC } from "@terajs/sfc";
import { Debug } from "@terajs/shared";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { createApp, h, nextTick, ref } from "vue";

type BenchmarkResult = {
  framework: string;
  mountMedianMs: number;
  mountMeanMs: number;
  targetedMedianMs: number;
  targetedUsPerUpdate: number;
  bulkMedianMs: number;
  bulkUsPerUpdate: number;
};

type BenchState = {
  status: "running" | "done" | "error";
  results?: BenchmarkResult[];
  error?: string;
};

const ROW_COUNT = readPositiveInt("rows", 1000);
const WARMUP_RUNS = readPositiveInt("warmup", 5);
const TIMED_RUNS = readPositiveInt("runs", 25);
const TARGETED_UPDATES = readPositiveInt("targeted", 200);
const BULK_UPDATES = readPositiveInt("bulk", 20);

const arena = document.querySelector("#mount-arena") as HTMLDivElement;
const configEl = document.querySelector("#config") as HTMLDivElement;
const statusEl = document.querySelector("#status") as HTMLDivElement;
const resultsBodyEl = document.querySelector("#results-body") as HTMLTableSectionElement;
const summaryEl = document.querySelector("#summary") as HTMLDivElement;

const benchState: BenchState = {
  status: "running"
};

(globalThis as typeof globalThis & { __TERAJS_BROWSER_BENCH__?: BenchState }).__TERAJS_BROWSER_BENCH__ = benchState;

Debug.emit = () => {};

configEl.innerHTML = `<p><code>${ROW_COUNT}</code> rows, <code>${TARGETED_UPDATES}</code> targeted updates, <code>${BULK_UPDATES}</code> full-list updates, <code>${WARMUP_RUNS}</code> warmups, <code>${TIMED_RUNS}</code> timed runs.</p>`;

run().catch((error) => {
  benchState.status = "error";
  benchState.error = error instanceof Error ? error.stack ?? error.message : String(error);
  statusEl.classList.add("error");
  statusEl.innerHTML = `<strong>Failed.</strong> <code>${escapeHtml(benchState.error)}</code>`;
  summaryEl.innerHTML = "";
  console.error("Browser framework benchmark failed.", error);
});

async function run(): Promise<void> {
  const terajsIrModule = createTerajsBenchmarkIR();
  const results: BenchmarkResult[] = [];

  statusEl.innerHTML = "<strong>Running…</strong> This can take a minute in a real browser.";

  results.push(await benchmarkFramework("Terajs", () => createTerajsHarness(terajsIrModule)));
  renderResults(results);

  results.push(await benchmarkFramework("Vue", () => createVueHarness()));
  renderResults(results);

  results.push(await benchmarkFramework("React", () => createReactHarness()));
  renderResults(results);

  benchState.status = "done";
  benchState.results = results;
  statusEl.innerHTML = "<strong>Complete.</strong> Results below are from the real browser DOM, not jsdom.";
  summaryEl.innerHTML = renderSummary(results);
  console.table(results);
}

function readPositiveInt(param: string, fallback: number): number {
  const raw = new URLSearchParams(location.search).get(param);
  const parsed = raw ? Number(raw) : fallback;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${param} must be a positive integer.`);
  }
  return parsed;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

function formatMs(value: number): string {
  return `${value.toFixed(2)} ms`;
}

function formatUs(value: number): string {
  return `${value.toFixed(1)} us`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function createTerajsBenchmarkIR() {
  const rows = Array.from({ length: ROW_COUNT }, (_, index) => `<li data-row="${index}">{{ row${index} }}</li>`).join("");
  const source = `<template><ul>${rows}</ul></template>`;
  const parsed = parseSFC(source, "/benchmarks/framework-rows.tera");
  return compileTemplateFromSFC(parsed);
}

function createMountTarget(): HTMLDivElement {
  const root = document.createElement("div");
  arena.appendChild(root);
  return root;
}

function createTerajsHarness(irModule: ReturnType<typeof createTerajsBenchmarkIR>) {
  const root = createMountTarget();
  const values = Array.from({ length: ROW_COUNT }, (_, index) => signal(index));
  const ctx = Object.fromEntries(values.map((value, index) => [`row${index}`, value]));

  const App = () => renderIRModuleToFragment(irModule, ctx);

  mount(App, root);

  return {
    updateOne(iteration: number) {
      const rowIndex = iteration % ROW_COUNT;
      const row = values[rowIndex];
      row.set(row() + 1);
    },
    updateAll() {
      for (const row of values) {
        row.set(row() + 1);
      }
    },
    destroy() {
      unmount(root);
      root.remove();
    }
  };
}

function createReactHarness() {
  const rootElement = createMountTarget();
  let setValues: React.Dispatch<React.SetStateAction<number[]>> | null = null;

  function App() {
    const [values, assignValues] = useState(() => Array.from({ length: ROW_COUNT }, (_, index) => index));
    setValues = assignValues;

    return React.createElement(
      "ul",
      null,
      values.map((value, index) => React.createElement("li", {
        key: index,
        "data-row": String(index)
      }, String(value)))
    );
  }

  const root = createRoot(rootElement);
  flushSync(() => {
    root.render(React.createElement(App));
  });

  return {
    updateOne(iteration: number) {
      const rowIndex = iteration % ROW_COUNT;
      flushSync(() => {
        setValues?.((previous) => {
          const next = previous.slice();
          next[rowIndex] += 1;
          return next;
        });
      });
    },
    updateAll() {
      flushSync(() => {
        setValues?.((previous) => previous.map((value) => value + 1));
      });
    },
    destroy() {
      flushSync(() => {
        root.unmount();
      });
      rootElement.remove();
    }
  };
}

function createVueHarness() {
  const rootElement = createMountTarget();
  const values = ref(Array.from({ length: ROW_COUNT }, (_, index) => index));

  const app = createApp({
    setup() {
      return () => h(
        "ul",
        null,
        values.value.map((value, index) => h("li", {
          key: index,
          "data-row": String(index)
        }, String(value)))
      );
    }
  });

  app.mount(rootElement);

  return {
    async updateOne(iteration: number) {
      const rowIndex = iteration % ROW_COUNT;
      values.value[rowIndex] += 1;
      await nextTick();
    },
    async updateAll() {
      for (let index = 0; index < values.value.length; index += 1) {
        values.value[index] += 1;
      }
      await nextTick();
    },
    destroy() {
      app.unmount();
      rootElement.remove();
    }
  };
}

async function warmupAndMeasure(runs: number, execute: () => void | Promise<void>) {
  for (let runIndex = 0; runIndex < WARMUP_RUNS; runIndex += 1) {
    await execute();
  }

  const samples: number[] = [];
  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    const startedAt = performance.now();
    await execute();
    samples.push(performance.now() - startedAt);
  }

  return {
    meanMs: average(samples),
    medianMs: median(samples)
  };
}

async function benchmarkFramework(name: string, createHarness: () => {
  updateOne: (iteration: number) => void | Promise<void>;
  updateAll: () => void | Promise<void>;
  destroy: () => void | Promise<void>;
}) {
  const mount = await warmupAndMeasure(TIMED_RUNS, async () => {
    const harness = createHarness();
    await harness.destroy();
  });

  const targeted = await warmupAndMeasure(TIMED_RUNS, async () => {
    const harness = createHarness();
    try {
      for (let updateIndex = 0; updateIndex < TARGETED_UPDATES; updateIndex += 1) {
        await harness.updateOne(updateIndex);
      }
    } finally {
      await harness.destroy();
    }
  });

  const bulk = await warmupAndMeasure(TIMED_RUNS, async () => {
    const harness = createHarness();
    try {
      for (let updateIndex = 0; updateIndex < BULK_UPDATES; updateIndex += 1) {
        await harness.updateAll();
      }
    } finally {
      await harness.destroy();
    }
  });

  return {
    framework: name,
    mountMedianMs: mount.medianMs,
    mountMeanMs: mount.meanMs,
    targetedMedianMs: targeted.medianMs,
    targetedUsPerUpdate: (targeted.medianMs * 1000) / TARGETED_UPDATES,
    bulkMedianMs: bulk.medianMs,
    bulkUsPerUpdate: (bulk.medianMs * 1000) / BULK_UPDATES,
  } satisfies BenchmarkResult;
}

function renderResults(results: BenchmarkResult[]): void {
  resultsBodyEl.innerHTML = results.map((entry) => `
    <tr>
      <td>${entry.framework}</td>
      <td>${formatMs(entry.mountMedianMs)}</td>
      <td>${formatMs(entry.targetedMedianMs)}</td>
      <td>${formatUs(entry.targetedUsPerUpdate)}</td>
      <td>${formatMs(entry.bulkMedianMs)}</td>
      <td>${formatUs(entry.bulkUsPerUpdate)}</td>
    </tr>
  `).join("");
}

function renderSummary(results: BenchmarkResult[]): string {
  const terajs = results.find((entry) => entry.framework === "Terajs");
  if (!terajs) {
    return "";
  }

  return results.map((entry) => {
    const mountRatio = (entry.mountMedianMs / terajs.mountMedianMs).toFixed(2);
    const targetedRatio = (entry.targetedMedianMs / terajs.targetedMedianMs).toFixed(2);
    const bulkRatio = (entry.bulkMedianMs / terajs.bulkMedianMs).toFixed(2);

    return `<p><code>${entry.framework}</code>: mount ${mountRatio}x, targeted ${targetedRatio}x, bulk ${bulkRatio}x relative to Terajs.</p>`;
  }).join("");
}