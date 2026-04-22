#!/usr/bin/env node
import { performance } from "node:perf_hooks";
import { JSDOM } from "jsdom";

const NODE_COUNT = Number(process.env.TERAJS_DIRECT_TEXT_NODES ?? 5000);
const WARMUP_RUNS = Number(process.env.TERAJS_DIRECT_TEXT_WARMUP ?? 10);
const TIMED_RUNS = Number(process.env.TERAJS_DIRECT_TEXT_RUNS ?? 40);
const TARGETED_UPDATES = Number(process.env.TERAJS_DIRECT_TEXT_UPDATES ?? 500);

process.env.NODE_ENV = "production";

function assertPositiveInteger(name, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

async function loadRuntime() {
  const [{ dispose, signal }, { Debug }, dom, bindings] = await Promise.all([
    import("@terajs/reactivity"),
    import("@terajs/shared"),
    import("../packages/renderer-web/dist/dom.js"),
    import("../packages/renderer-web/dist/bindings.js")
  ]);

  Debug.emit = () => {};

  return {
    dispose,
    signal,
    addNodeCleanup: dom.addNodeCleanup,
    clear: dom.clear,
    createFragment: dom.createFragment,
    createText: dom.createText,
    insert: dom.insert,
    setText: dom.setText,
    bindDirectTextSource: bindings.bindDirectTextSource
  };
}

function createSources(signal) {
  return Array.from({ length: NODE_COUNT }, (_, index) => signal(index));
}

function createMountTarget() {
  const root = document.createElement("div");
  document.body.appendChild(root);
  return root;
}

function mountLegacy(runtime, root, sources) {
  const fragment = runtime.createFragment();

  for (const source of sources) {
    const text = runtime.createText("");
    runtime.bindDirectTextSource(text, source);
    runtime.insert(fragment, text);
  }

  runtime.insert(root, fragment);
}

function mountPreseeded(runtime, root, sources) {
  const fragment = runtime.createFragment();

  for (const source of sources) {
    const text = runtime.createText(String(source()));
    bindRejectedPreseededVariant(runtime, text, source);
    runtime.insert(fragment, text);
  }

  runtime.insert(root, fragment);
}

function bindRejectedPreseededVariant(runtime, node, source) {
  const subscriber = (() => {
    if (subscriber.active === false) {
      return;
    }

    runtime.setText(node, source());
  });

  subscriber.deps = [];
  subscriber.cleanups = [];
  subscriber.active = true;

  source._dep.add(subscriber);
  subscriber.deps.push(source._dep);

  runtime.addNodeCleanup(node, () => {
    runtime.dispose(subscriber);
  });
}

function createHarness(runtime, strategy) {
  const root = createMountTarget();
  const sources = createSources(runtime.signal);

  strategy(runtime, root, sources);

  return {
    updateOne(iteration) {
      const index = iteration % sources.length;
      const source = sources[index];
      source.set(source() + 1);
    },
    destroy() {
      runtime.clear(root);
      root.remove();
    }
  };
}

async function warmupAndMeasure(runs, execute) {
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
    meanMs: average(samples),
    medianMs: median(samples)
  };
}

async function benchmarkStrategy(runtime, label, strategy) {
  const mount = await warmupAndMeasure(TIMED_RUNS, async () => {
    const harness = createHarness(runtime, strategy);
    harness.destroy();
  });

  const targeted = await warmupAndMeasure(TIMED_RUNS, async () => {
    const harness = createHarness(runtime, strategy);
    try {
      for (let updateIndex = 0; updateIndex < TARGETED_UPDATES; updateIndex += 1) {
        harness.updateOne(updateIndex);
      }
    } finally {
      harness.destroy();
    }
  });

  return {
    label,
    mountMedianMs: mount.medianMs,
    mountMeanMs: mount.meanMs,
    targetedMedianMs: targeted.medianMs,
    targetedUsPerUpdate: (targeted.medianMs * 1000) / TARGETED_UPDATES
  };
}

function printComparison(results) {
  console.log(`Compared ${NODE_COUNT} direct text nodes with ${TARGETED_UPDATES} targeted updates, ${WARMUP_RUNS} warmups, and ${TIMED_RUNS} timed runs per strategy.`);
  console.table(results.map((entry) => ({
    Strategy: entry.label,
    "Mount median": formatMs(entry.mountMedianMs),
    "Mount mean": formatMs(entry.mountMeanMs),
    "Targeted median": formatMs(entry.targetedMedianMs),
    "Targeted per update": formatUs(entry.targetedUsPerUpdate)
  })));

  if (results.length < 2) {
    return;
  }

  const [legacy, candidate] = results;

  const mountDelta = legacy.mountMedianMs - candidate.mountMedianMs;
  const mountPercent = legacy.mountMedianMs > 0 ? (mountDelta / legacy.mountMedianMs) * 100 : 0;
  const targetedDelta = legacy.targetedMedianMs - candidate.targetedMedianMs;
  const targetedPercent = legacy.targetedMedianMs > 0 ? (targetedDelta / legacy.targetedMedianMs) * 100 : 0;

  console.log(`${candidate.label} mount delta vs legacy: ${formatMs(mountDelta)} (${mountPercent.toFixed(1)}% ${mountDelta >= 0 ? "faster" : "slower"})`);
  console.log(`${candidate.label} targeted delta vs legacy: ${formatMs(targetedDelta)} (${targetedPercent.toFixed(1)}% ${targetedDelta >= 0 ? "faster" : "slower"})`);
}

async function main() {
  assertPositiveInteger("TERAJS_DIRECT_TEXT_NODES", NODE_COUNT);
  assertPositiveInteger("TERAJS_DIRECT_TEXT_WARMUP", WARMUP_RUNS);
  assertPositiveInteger("TERAJS_DIRECT_TEXT_RUNS", TIMED_RUNS);
  assertPositiveInteger("TERAJS_DIRECT_TEXT_UPDATES", TARGETED_UPDATES);

  const domEnvironment = createDomEnvironment();

  try {
    const runtime = await loadRuntime();
    const results = [];

    results.push(await benchmarkStrategy(runtime, "Legacy empty-then-write", mountLegacy));
    results.push(await benchmarkStrategy(runtime, "Rejected preseeded variant", mountPreseeded));

    printComparison(results);
  } finally {
    domEnvironment.cleanup();
  }
}

main().catch((error) => {
  console.error("Direct text benchmark failed.");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});