import { describe, expect, it } from "vitest";
import { randomCardIds } from "./cardIds";
import { CELLS, FREE_INDEX, cardLayout, winningLines } from "./cards";
import { mulberry32 } from "./random";

const ids = Array.from({ length: 27 }, (_, i) => `t${i}`);

describe("cardLayout", () => {
  it("is the same every time for a given card ID", () => {
    expect(cardLayout("bubbly-misty-otter", ids)).toEqual(cardLayout("bubbly-misty-otter", ids));
  });

  it("pins the layout of a known card", () => {
    // Changing this changes every printed card; update it only when reprinting everything.
    expect(cardLayout("bubbly-misty-otter", ids).slice(0, 5)).toMatchInlineSnapshot(`
      [
        "t20",
        "t13",
        "t8",
        "t21",
        "t10",
      ]
    `);
  });

  it("has 24 distinct tiles and a FREE centre", () => {
    const card = cardLayout("calm-cool-sea", ids);
    expect(card).toHaveLength(CELLS);
    expect(card[FREE_INDEX]).toBeNull();
    const tiles = card.filter((c) => c !== null);
    expect(new Set(tiles).size).toBe(CELLS - 1);
  });

  it("gives different card IDs different layouts", () => {
    const cardIds = randomCardIds(500, [], mulberry32(3));
    expect(new Set(cardIds.map((id) => cardLayout(id, ids).join(","))).size).toBe(500);
  });

  it("rejects invalid card IDs", () => {
    expect(() => cardLayout("", ids)).toThrow(RangeError);
    expect(() => cardLayout("Bubbly Misty Otter", ids)).toThrow(RangeError);
    expect(() => cardLayout("bubbly-misty-unicorn", ids)).toThrow(RangeError);
  });
});

describe("winningLines", () => {
  const card = cardLayout("frosty-gentle-heron", ids);
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
