import { describe, expect, it } from "vitest";
import { computed, effect, signal, state } from "./index.js";

function createDiamond(readSource: () => number, depth = 8) {
  let current = computed(readSource);

  for (let index = 0; index < depth; index += 1) {
    const parent = current;
    const left = computed(() => parent.get());
    const right = computed(() => parent.get());
    current = computed(() => left.get() + right.get());
  }

  return current;
}

describe("reactive propagation", () => {
  it("runs a leaf effect once for one signal write across a computed diamond", () => {
    const source = signal(0);
    const result = createDiamond(source);
    let runs = 0;

    effect(() => {
      result.get();
      runs += 1;
    });

    source.set(1);

    expect(runs).toBe(2);
    expect(result.get()).toBe(256);
  });

  it("notifies a scheduled dependent once while a computed remains dirty", () => {
    const source = signal(0);
    const result = createDiamond(source);
    let schedules = 0;

    const watcher = effect(
      () => {
        result.get();
      },
      () => {
        schedules += 1;
      },
    );
    watcher();

    source.set(1);

    expect(schedules).toBe(1);
  });

  it("applies the same transactional propagation to state writes", () => {
    const source = state(0);
    const result = createDiamond(source.get);
    let runs = 0;

    effect(() => {
      result.get();
      runs += 1;
    });

    source.set(1);

    expect(runs).toBe(2);
    expect(result.get()).toBe(256);
  });

  it("does not reparent an existing effect when it reruns inside another effect", () => {
    const activeIndex = signal(0);
    const rowStatus = signal("current");
    const observedStatuses: string[] = [];

    effect(() => {
      observedStatuses.push(rowStatus());
    });

    effect(() => {
      const index = activeIndex();
      rowStatus.set(index === 0 ? "current" : index === 1 ? "complete" : "pending");
    });

    activeIndex.set(1);
    activeIndex.set(2);

    expect(observedStatuses).toEqual(["current", "complete", "pending"]);
  });
});
