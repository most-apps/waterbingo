import { describe, expect, it } from "vitest";
import { ADJECTIVES, EXAMPLE_CARD_ID, NOUNS, isCardId, parseCardId, randomCardId, randomCardIds } from "./cardIds";
import { mulberry32 } from "./random";

describe("word lists", () => {
  it.each([
    ["ADJECTIVES", ADJECTIVES],
    ["NOUNS", NOUNS],
  ])("%s are unique, lowercase words", (_, list) => {
    expect(new Set(list).size).toBe(list.length);
    for (const w of list) expect(w).toMatch(/^[a-z]+$/);
  });

  it("never share a word", () => {
    expect(ADJECTIVES.filter((w) => NOUNS.includes(w))).toEqual([]);
  });

  it("allow millions of IDs", () => {
    expect(ADJECTIVES.length * (ADJECTIVES.length - 1) * NOUNS.length).toBeGreaterThan(2_000_000);
  });
});

describe("randomCardId", () => {
  it("makes valid IDs with two different adjectives", () => {
    const random = mulberry32(1);
    for (let i = 0; i < 500; i++) {
      const id = randomCardId(random);
      expect(isCardId(id)).toBe(true);
    }
    expect(isCardId(EXAMPLE_CARD_ID)).toBe(true);
  });

  it("makes a batch with no repeats, avoiding IDs already taken", () => {
    const first = randomCardIds(200, [], mulberry32(2));
    const more = randomCardIds(200, first, mulberry32(2));
    expect(new Set([...first, ...more]).size).toBe(400);
  });
});

describe("isCardId", () => {
  it.each(["bubbly-misty", "bubbly-misty-otter-seal", "Bubbly-misty-otter", "bubbly-bubbly-otter", "otter-misty-bubbly", ""])(
    "rejects %j",
    (id) => expect(isCardId(id)).toBe(false),
  );
});

describe("parseCardId", () => {
  it.each(["bubbly-misty-otter", "Bubbly Misty Otter", "  bubbly,misty   otter ", "BUB MIS OTT"])("reads %j", (input) => {
    expect(parseCardId(input)).toEqual({ status: "ok", id: "bubbly-misty-otter" });
  });

  it("prefers an exact word over a longer one it starts", () => {
    expect(parseCardId("calm cool sea")).toEqual({ status: "ok", id: "calm-cool-sea" });
  });

  it.each(["", "bubbly", "bubbly misty", "bubbly misty s"])("waits for more of %j", (input) => {
    expect(parseCardId(input)).toEqual({ status: "incomplete" });
  });

  it.each([
    ["bubbly misty xyz", /“xyz”/],
    ["otter misty bubbly", /“otter”/],
    ["s misty otter", /more than one word/],
    ["bubbly bubbly otter", /same word twice/],
    ["bubbly misty otter seal", /three words/],
  ])("explains what is wrong with %j", (input, message) => {
    const parsed = parseCardId(input);
    expect(parsed.status).toBe("error");
    expect(parsed.status === "error" && parsed.message).toMatch(message);
  });
});
