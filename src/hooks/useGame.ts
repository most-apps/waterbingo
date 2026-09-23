import { useCallback, useEffect, useReducer } from "react";
import { TILE_IDS } from "../data/tiles";
import { gameReducer, initialGame, restoreGame } from "../lib/game";

const STORAGE_KEY = "water-bingo:game:v1";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? restoreGame(JSON.parse(raw), TILE_IDS) : initialGame;
  } catch {
    return initialGame;
  }
}

/** Caller game state, saved to localStorage so a refresh mid-event loses nothing. */
export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, load);

  useEffect(() => {
    try {
      if (state.order.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode, quota) — the game still works, it just won't survive a refresh.
    }
  }, [state]);

  return {
    state,
    start: useCallback(() => dispatch({ type: "start", tileIds: TILE_IDS }), []),
    next: useCallback(() => dispatch({ type: "next" }), []),
    undo: useCallback(() => dispatch({ type: "undo" }), []),
    reset: useCallback(() => dispatch({ type: "reset" }), []),
  };
}
