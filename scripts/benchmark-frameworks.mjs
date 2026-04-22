#!/usr/bin/env node
import { performance } from "node:perf_hooks";
import { JSDOM } from "jsdom";

const ROW_COUNT = Number(process.env.TERAJS_BENCH_ROWS ?? 1000);
const WARMUP_RUNS = Number(process.env.TERAJS_BENCH_WARMUP ?? 5);
const TIMED_RUNS = Number(process.env.TERAJS_BENCH_RUNS ?? 25);
const TARGETED_UPDATES = Number(process.env.TERAJS_BENCH_TARGETED_UPDATES ?? 200);
const BULK_UPDATES = Number(process.env.TERAJS_BENCH_BULK_UPDATES ?? 20);

process.env.NODE_ENV = "production";

function assertPositiveInteger(name, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

function ratioToBaseline(value, baseline) {
  return baseline > 0 ? value / baseline : Number.NaN;
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

function formatUs(value) {
  return `${value.toFixed(1)} us`;
}

function createDomEnvironment() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    url: "http://localhost/"
  });

  const { window } = dom;
  const previousValues = new Map();
  const assignments = {
    window,
    document: window.document,
    self: window,
    navigator: window.navigator,
    Node: window.Node,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    SVGElement: window.SVGElement,
    Text: window.Text,
    Comment: window.Comment,
    DocumentFragment: window.DocumentFragment,
    MutationObserver: window.MutationObserver,
    Event: window.Event,
    CustomEvent: window.CustomEvent,
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window)
  };

  for (const [key, value] of Object.entries(assignments)) {
    previousValues.set(key, {
      descriptor: Object.getOwnPropertyDescriptor(globalThis, key)
    });
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value
    });
  }

  return {
    cleanup() {
      for (const [key, snapshot] of previousValues.entries()) {
        if (snapshot.descriptor) {
          Object.defineProperty(globalThis, key, snapshot.descriptor);
        } else {
          delete globalThis[key];
        }
      }

      dom.window.close();
    }
  };
}

async function loadFrameworks() {
  const [{ mount, unmount, renderIRModuleToFragment }, { signal }, { parseSFC, compileTemplateFromSFC }, { Debug }, React, ReactDomClient, ReactDom, Vue] = await Promise.all([
    import("@terajs/renderer-web"),
    import("@terajs/reactivity"),
    import("@terajs/sfc"),
    import("@terajs/shared"),
    import("react"),
    import("react-dom/client"),
    import("react-dom"),
    import("vue")
  ]);

  Debug.emit = () => {};

  return {
    terajs: { mount, unmount, renderIRModuleToFragment, signal, parseSFC, compileTemplateFromSFC },
    react: {
      createElement: React.createElement,
      useState: React.useState,
      createRoot: ReactDomClient.createRoot,
      flushSync: ReactDom.flushSync
    },
    vue: {
      createApp: Vue.createApp,
      h: Vue.h,
      nextTick: Vue.nextTick,
      ref: Vue.ref
    }
  };
}

function createTerajsBenchmarkIR(frameworks) {
  const rows = Array.from({ length: ROW_COUNT }, (_, index) => `<li data-row="${index}">{{ row${index} }}</li>`).join("");
  const source = `<template><ul>${rows}</ul></template>`;
  const parsed = frameworks.terajs.parseSFC(source, "/benchmarks/framework-rows.tera");
  return frameworks.terajs.compileTemplateFromSFC(parsed);
}

function createMountTarget() {
  const root = document.createElement("div");
  document.body.appendChild(root);
  return root;
}

function createTerajsHarness(frameworks, irModule) {
  const root = createMountTarget();
  const values = Array.from({ length: ROW_COUNT }, (_, index) => frameworks.terajs.signal(index));
  const ctx = Object.fromEntries(values.map((value, index) => [`row${index}`, value]));

  const App = () => frameworks.terajs.renderIRModuleToFragment(irModule, ctx);

  frameworks.terajs.mount(App, root);

  return {
    updateOne(iteration) {
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
      frameworks.terajs.unmount(root);
      root.remove();
    }
  };
}

function createReactHarness(frameworks) {
  const rootElement = createMountTarget();
  let setValues = null;

  function App() {
    const [values, assignValues] = frameworks.react.useState(() => Array.from({ length: ROW_COUNT }, (_, index) => index));
    setValues = assignValues;
    return frameworks.react.createElement(
      "ul",
      null,
      values.map((value, index) => frameworks.react.createElement("li", {
        key: index,
        "data-row": String(index)
      }, String(value)))
    );
  }

  const root = frameworks.react.createRoot(rootElement);
  frameworks.react.flushSync(() => {
    root.render(frameworks.react.createElement(App));
  });

  return {
    updateOne(iteration) {
      const rowIndex = iteration % ROW_COUNT;
      frameworks.react.flushSync(() => {
        setValues((previous) => {
          const next = previous.slice();
          next[rowIndex] += 1;
          return next;
        });
      });
    },
    updateAll() {
      frameworks.react.flushSync(() => {
        setValues((previous) => previous.map((value) => value + 1));
      });
    },
    destroy() {
      frameworks.react.flushSync(() => {
        root.unmount();
      });
      rootElement.remove();
    }
  };
}

function createVueHarness(frameworks) {
  const rootElement = createMountTarget();
  const values = frameworks.vue.ref(Array.from({ length: ROW_COUNT }, (_, index) => index));

  const App = {
    setup() {
      return () => frameworks.vue.h(
        "ul",
        null,
        values.value.map((value, index) => frameworks.vue.h("li", {
          key: index,
          "data-row": String(index)
        }, String(value)))
      );
    }
  };

  const app = frameworks.vue.createApp(App);
  app.mount(rootElement);

  return {
    async updateOne(iteration) {
      const rowIndex = iteration % ROW_COUNT;
      values.value[rowIndex] += 1;
      await frameworks.vue.nextTick();
    },
    async updateAll() {
      for (let index = 0; index < values.value.length; index += 1) {
        values.value[index] += 1;
      }
      await frameworks.vue.nextTick();
    },
    destroy() {
      app.unmount();
      rootElement.remove();
    }
  };
}

async function warmupAndMeasure(label, runs, execute) {
  for (let runIndex = 0; runIndex < WARMUP_RUNS; runIndex += 1) {
    await execute();
  }

  const samples = [];
  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    const startedAt = performance.now();
    await execute();
    samples.push(performance.now() - startedAt);
  }

  return {
    label,
    samples,
    meanMs: average(samples),
    medianMs: median(samples),
    minMs: Math.min(...samples),
    maxMs: Math.max(...samples)
  };
}

async function benchmarkFramework(name, createHarness) {
  const mountMetrics = await warmupAndMeasure(`${name}:mount`, TIMED_RUNS, async () => {
    const harness = createHarness();
    await harness.destroy();
  });

  const targetedMetrics = await warmupAndMeasure(`${name}:targeted`, TIMED_RUNS, async () => {
    const harness = createHarness();
    try {
      for (let updateIndex = 0; updateIndex < TARGETED_UPDATES; updateIndex += 1) {
        await harness.updateOne(updateIndex);
      }
    } finally {
      await harness.destroy();
    }
  });

  const bulkMetrics = await warmupAndMeasure(`${name}:bulk`, TIMED_RUNS, async () => {
    const harness = createHarness();
    try {
      for (let updateIndex = 0; updateIndex < BULK_UPDATES; updateIndex += 1) {
        await harness.updateAll(updateIndex);
      }
    } finally {
      await harness.destroy();
    }
  });

  return {
    framework: name,
    mountMedianMs: mountMetrics.medianMs,
    mountMeanMs: mountMetrics.meanMs,
    targetedMedianMs: targetedMetrics.medianMs,
    targetedUsPerUpdate: (targetedMetrics.medianMs * 1000) / TARGETED_UPDATES,
    bulkMedianMs: bulkMetrics.medianMs,
    bulkUsPerUpdate: (bulkMetrics.medianMs * 1000) / BULK_UPDATES
  };
}

function printSummary(results) {
  const baseline = results.find((entry) => entry.framework === "Terajs") ?? results[0];
  console.log("\nFramework benchmark summary");
  console.table(results.map((entry) => ({
    Framework: entry.framework,
    "Mount median": formatMs(entry.mountMedianMs),
    "Targeted median": formatMs(entry.targetedMedianMs),
    "Targeted per update": formatUs(entry.targetedUsPerUpdate),
    "Bulk median": formatMs(entry.bulkMedianMs),
    "Bulk per update": formatUs(entry.bulkUsPerUpdate)
  })));

  console.log("Relative to Terajs median totals");
  for (const entry of results) {
    console.log(`- ${entry.framework}: mount ${ratioToBaseline(entry.mountMedianMs, baseline.mountMedianMs).toFixed(2)}x, targeted ${ratioToBaseline(entry.targetedMedianMs, baseline.targetedMedianMs).toFixed(2)}x, bulk ${ratioToBaseline(entry.bulkMedianMs, baseline.bulkMedianMs).toFixed(2)}x`);
  }
}

async function main() {
  assertPositiveInteger("TERAJS_BENCH_ROWS", ROW_COUNT);
  assertPositiveInteger("TERAJS_BENCH_WARMUP", WARMUP_RUNS);
  assertPositiveInteger("TERAJS_BENCH_RUNS", TIMED_RUNS);
  assertPositiveInteger("TERAJS_BENCH_TARGETED_UPDATES", TARGETED_UPDATES);
  assertPositiveInteger("TERAJS_BENCH_BULK_UPDATES", BULK_UPDATES);

  const domEnvironment = createDomEnvironment();

  try {
    const frameworks = await loadFrameworks();
    const terajsIrModule = createTerajsBenchmarkIR(frameworks);
    const results = [];

    results.push(await benchmarkFramework("Terajs", () => createTerajsHarness(frameworks, terajsIrModule)));
    results.push(await benchmarkFramework("Vue", () => createVueHarness(frameworks)));
    results.push(await benchmarkFramework("React", () => createReactHarness(frameworks)));

    console.log(`Compared production builds with ${ROW_COUNT} rows, ${TARGETED_UPDATES} targeted updates, ${BULK_UPDATES} full-list updates, ${WARMUP_RUNS} warmups, and ${TIMED_RUNS} timed runs per scenario.`);
    printSummary(results);
  } finally {
    domEnvironment.cleanup();
  }
}

main().catch((error) => {
  console.error("Framework benchmark failed.");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});