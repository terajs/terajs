/**
 * @file memo.spec.ts
 * Tests for Terajs's memo, markStatic, and shallowRef utilities.
 */
import { memo, markStatic, shallowRef } from "./memo";

describe("memo utility", () => {
  it("returns the same value if deps are shallow-equal", () => {
    let calls = 0;
    const key = Symbol('test1');
    const fn = () => { calls++; return Math.random(); };
    const a = 1, b = 2;
    const v1 = memo(key, fn, [a, b]);
    const v2 = memo(key, fn, [a, b]);
    expect(v1).toBe(v2);
    expect(calls).toBe(1);
  });
  it("recomputes if deps change", () => {
    let calls = 0;
    const key = Symbol('test2');
    const fn = () => { calls++; return Math.random(); };
    const v1 = memo(key, fn, [1, 2]);
    const v2 = memo(key, fn, [1, 3]);
    expect(v1).not.toBe(v2);
    expect(calls).toBe(2);
  });
});

describe("markStatic", () => {
  it("marks an object as static", () => {
    const arr = markStatic([1, 2, 3]);
    expect((arr as any).__terajs_static__).toBe(true);
  });
});

describe("shallowRef", () => {
  it("only .value is reactive, not nested", () => {
    const obj = { a: 1 };
    const ref = shallowRef(obj);
    expect(ref.value).toBe(obj);
    ref.value = { a: 2 };
    expect(ref.value.a).toBe(2);
  });
});
