import { shuffle } from "./random";

/**
 * Caller state. `order` is the full shuffled deck for this game; the first
 * `calledCount` entries have been called. An empty `order` means no game.
 */
export interface GameState {
  order: string[];
  calledCount: number;
}

export type GameAction =
  | { type: "start"; tileIds: readonly string[] }
  | { type: "next" }
  | { type: "undo" }
  | { type: "reset" };

export const initialGame: GameState = { order: [], calledCount: 0 };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "start":
      return { order: shuffle(action.tileIds), calledCount: 1 };
    case "next":
      return state.calledCount < state.order.length
        ? { ...state, calledCount: state.calledCount + 1 }
        : state;
    case "undo":
      return state.calledCount > 1 ? { ...state, calledCount: state.calledCount - 1 } : state;
    case "reset":
      return initialGame;
  }
}

export const isStarted = (s: GameState) => s.order.length > 0;
export const isFinished = (s: GameState) => isStarted(s) && s.calledCount === s.order.length;
export const calledIds = (s: GameState) => s.order.slice(0, s.calledCount);
export const currentId = (s: GameState): string | undefined => s.order[s.calledCount - 1];

/** Accepts a saved game only if it still matches the current tile set. */
export function restoreGame(raw: unknown, tileIds: readonly string[]): GameState {
  if (!raw || typeof raw !== "object") return initialGame;
  const { order, calledCount } = raw as Partial<GameState>;
  const valid = new Set(tileIds);
  if (
    !Array.isArray(order) ||
    order.length !== tileIds.length ||
    new Set(order).size !== order.length ||
    !order.every((id) => typeof id === "string" && valid.has(id)) ||
    typeof calledCount !== "number" ||
    !Number.isInteger(calledCount) ||
    calledCount < 1 ||
    calledCount > order.length
  ) {
    return initialGame;
  }
  return { order, calledCount };
}
