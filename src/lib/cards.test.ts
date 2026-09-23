import { describe, expect, it } from "vitest";
import { CELLS, FREE_INDEX, cardLayout, winningLines } from "./cards";

const ids = Array.from({ length: 27 }, (_, i) => `t${i}`);

describe("cardLayout", () => {
  it("is the same every time for a given card number", () => {
    expect(cardLayout(17, ids)).toEqual(cardLayout(17, ids));
  });

  it("has 24 distinct tiles and a FREE centre", () => {
    const card = cardLayout(1, ids);
    expect(card).toHaveLength(CELLS);
    expect(card[FREE_INDEX]).toBeNull();
    const tiles = card.filter((c) => c !== null);
    expect(new Set(tiles).size).toBe(CELLS - 1);
  });

  it("gives different card numbers different layouts", () => {
    const seen = new Set<string>();
    for (let n = 1; n <= 500; n++) seen.add(cardLayout(n, ids).join(","));
    expect(seen.size).toBe(500);
  });

  it("rejects invalid card numbers", () => {
    expect(() => cardLayout(0, ids)).toThrow(RangeError);
    expect(() => cardLayout(1.5, ids)).toThrow(RangeError);
    expect(() => cardLayout(10000, ids)).toThrow(RangeError);
  });
});

describe("winningLines", () => {
  const card = cardLayout(3, ids);
  const at = (...idx: number[]) => new Set(idx.map((i) => card[i]).filter((c): c is string => c !== null));

  it("finds nothing on an empty board", () => {
    expect(winningLines(card, new Set())).toEqual([]);
  });

  it("counts the FREE centre toward the middle row", () => {
    expect(winningLines(card, at(10, 11, 13, 14))).toEqual([[10, 11, 12, 13, 14]]);
  });

  it("finds a column and a diagonal", () => {
    expect(winningLines(card, at(0, 5, 10, 15, 20))).toEqual([[0, 5, 10, 15, 20]]);
    expect(winningLines(card, at(4, 8, 16, 20))).toEqual([[4, 8, 12, 16, 20]]);
  });

  it("needs all five cells", () => {
    expect(winningLines(card, at(0, 1, 2, 3))).toEqual([]);
  });
});
