import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import type { IRElementNode } from "@terajs/compiler";
import { signal } from "@terajs/reactivity";

import { clear } from "./dom.js";
import { renderIRNode } from "./renderFromIR.js";
import { createHintedBoundPropElementNode } from "./testing/rendererConformance.js";

const NODE_COUNT = 250;
const TARGETED_UPDATES = 250;
const RUNS = 5;

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

async function measureTargetedUpdates(nodeFactory: () => IRElementNode): Promise<number> {
  const samples: number[] = [];

  for (let runIndex = 0; runIndex < RUNS; runIndex += 1) {
    const root = document.createElement("div");
    document.body.appendChild(root);

    const titles = Array.from({ length: NODE_COUNT }, (_, index) => signal(`value-${index}`));

    try {
      for (const title of titles) {
        root.appendChild(renderIRNode(nodeFactory(), { title }) as Node);
      }

      const startedAt = performance.now();
      for (let updateIndex = 0; updateIndex < TARGETED_UPDATES; updateIndex += 1) {
        const source = titles[updateIndex % titles.length];
        source.set(`value-${runIndex}-${updateIndex}`);
      }
      samples.push(performance.now() - startedAt);
    } finally {
      clear(root);
      root.remove();
    }
  }

  return median(samples);
}

describe("renderFromIR DOM prop perf canary", () => {
  it("keeps hinted prop updates ahead of generic bound prop updates", async () => {
    const hintedMedian = await measureTargetedUpdates(() => createHintedBoundPropElementNode());
    const genericMedian = await measureTargetedUpdates(() => createHintedBoundPropElementNode({ hinted: false }));

    expect(hintedMedian).toBeLessThanOrEqual(genericMedian * 1.1);
  });
});