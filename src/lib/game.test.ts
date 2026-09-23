import { describe, expect, it } from "vitest";
import { calledIds, currentId, gameReducer, initialGame, isFinished, restoreGame } from "./game";

const ids = ["a", "b", "c"];

describe("gameReducer", () => {
  it("start calls the first tile of a full shuffled deck", () => {
    const s = gameReducer(initialGame, { type: "start", tileIds: ids });
    expect([...s.order].sort()).toEqual(ids);
    expect(s.calledCount).toBe(1);
    expect(currentId(s)).toBe(s.order[0]);
  });

  it("next advances and stops at the end instead of restarting", () => {
    let s = gameReducer(initialGame, { type: "start", tileIds: ids });
    s = gameReducer(s, { type: "next" });
    s = gameReducer(s, { type: "next" });
    expect(isFinished(s)).toBe(true);
    expect(gameReducer(s, { type: "next" })).toBe(s);
    expect(calledIds(s)).toEqual(s.order);
  });

  it("undo steps back but never below the first call", () => {
    let s = gameReducer(initialGame, { type: "start", tileIds: ids });
    s = gameReducer(s, { type: "next" });
    s = gameReducer(s, { type: "undo" });
    expect(s.calledCount).toBe(1);
    expect(gameReducer(s, { type: "undo" })).toBe(s);
  });

  it("reset clears the game", () => {
    const s = gameReducer(initialGame, { type: "start", tileIds: ids });
    expect(gameReducer(s, { type: "reset" })).toEqual(initialGame);
  });
});

describe("restoreGame", () => {
  it("accepts a valid saved game", () => {
    expect(restoreGame({ order: ["c", "a", "b"], calledCount: 2 }, ids)).toEqual({
      order: ["c", "a", "b"],
      calledCount: 2,
    });
  });

  it.each([
    null,
    "junk",
    { order: ["a", "b"], calledCount: 1 },
    { order: ["a", "a", "b"], calledCount: 1 },
    { order: ["a", "b", "z"], calledCount: 1 },
    { order: ["a", "b", "c"], calledCount: 0 },
    { order: ["a", "b", "c"], calledCount: 4 },
  ])("rejects %j", (raw) => {
    expect(restoreGame(raw, ids)).toEqual(initialGame);
  });
});
