import { describe, expect, it } from "vitest";
import { mulberry32, shuffle } from "./random";

describe("mulberry32", () => {
  it("is deterministic per seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("returns values in [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  it("keeps every item exactly once and does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, mulberry32(1));
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((x, y) => x - y)).toEqual(input);
  });

  it("is roughly uniform (each item lands first ~1/n of the time)", () => {
    const r = mulberry32(123);
    const counts = [0, 0, 0, 0];
    const runs = 20000;
    for (let i = 0; i < runs; i++) counts[shuffle([0, 1, 2, 3], r)[0] as number]!++;
    for (const c of counts) expect(Math.abs(c / runs - 0.25)).toBeLessThan(0.02);
  });
});
