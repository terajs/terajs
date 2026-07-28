import { describe, expect, it } from "vitest";
import { batch, effect, signal } from "../index.js";

describe("batch", () => {
  it("is public and flushes an effect once after multiple writes", () => {
    const first = signal(0);
    const second = signal(0);
    let runs = 0;
    let total = 0;

    effect(() => {
      runs += 1;
      total = first() + second();
    });

    batch(() => {
      first.set(2);
      second.set(3);
      first.set(4);
      expect(runs).toBe(1);
    });

    expect(runs).toBe(2);
    expect(total).toBe(7);
  });

  it("flushes queued effects when a batch callback throws", () => {
    const value = signal(0);
    let observed = 0;

    effect(() => {
      observed = value();
    });

    expect(() => batch(() => {
      value.set(1);
      throw new Error("stop");
    })).toThrow("stop");

    expect(observed).toBe(1);
  });
});
