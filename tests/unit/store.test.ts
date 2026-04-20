import { describe, test, expect, vi } from "vitest";
import { Store } from "../../src/state/store";

describe("Store", () => {
  test("holds initial value", () => {
    const s = new Store({ n: 1 });
    expect(s.value).toEqual({ n: 1 });
  });

  test("set replaces value and notifies subscribers", () => {
    const s = new Store({ n: 1 });
    const fn = vi.fn();
    s.subscribe(fn);
    s.set({ n: 2 });
    expect(s.value).toEqual({ n: 2 });
    expect(fn).toHaveBeenCalledWith({ n: 2 });
  });

  test("update merges a partial into the current value", () => {
    const s = new Store({ a: 1, b: 2 });
    s.update({ b: 9 });
    expect(s.value).toEqual({ a: 1, b: 9 });
  });

  test("subscribe returns an unsubscribe function", () => {
    const s = new Store({ n: 1 });
    const fn = vi.fn();
    const unsub = s.subscribe(fn);
    s.set({ n: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    s.set({ n: 3 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("run invokes fn immediately with current value, then subscribes", () => {
    const s = new Store({ n: 1 });
    const fn = vi.fn();
    s.run(fn);
    expect(fn).toHaveBeenNthCalledWith(1, { n: 1 });
    s.set({ n: 2 });
    expect(fn).toHaveBeenNthCalledWith(2, { n: 2 });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("set with the same reference does not notify", () => {
    const s = new Store({ n: 1 });
    const fn = vi.fn();
    s.subscribe(fn);
    s.set(s.value);
    expect(fn).not.toHaveBeenCalled();
  });

  test("multiple subscribers all fire", () => {
    const s = new Store({ n: 1 });
    const a = vi.fn();
    const b = vi.fn();
    s.subscribe(a);
    s.subscribe(b);
    s.set({ n: 2 });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });
});
