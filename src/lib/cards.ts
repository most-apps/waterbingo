import { mulberry32, shuffle } from "./random";

export const GRID = 5;
export const CELLS = GRID * GRID;
export const FREE_INDEX = Math.floor(CELLS / 2);
export const MAX_CARD_NUMBER = 9999;

/** A card cell is a tile id, or `null` for the FREE centre square. */
export type CardCell = string | null;

// Bumping this reshuffles every card number — only do it together with reprinting.
const CARD_SALT = 0x57a7e2;

/**
 * The layout of card #`cardNumber`. Deterministic: the same number always
 * yields the same card, so the caller can verify any printed card by number.
 */
export function cardLayout(cardNumber: number, tileIds: readonly string[]): CardCell[] {
  if (!Number.isInteger(cardNumber) || cardNumber < 1 || cardNumber > MAX_CARD_NUMBER) {
    throw new RangeError(`Card number must be 1–${MAX_CARD_NUMBER}, got ${cardNumber}`);
  }
  if (tileIds.length < CELLS - 1) {
    throw new RangeError(`Need at least ${CELLS - 1} tiles, have ${tileIds.length}`);
  }
  const random = mulberry32(Math.imul(cardNumber, 0x9e3779b1) ^ CARD_SALT);
  const picked: CardCell[] = shuffle(tileIds, random).slice(0, CELLS - 1);
  picked.splice(FREE_INDEX, 0, null);
  return picked;
}

export const formatCardNumber = (n: number) => `#${String(n).padStart(4, "0")}`;

const LINES: readonly (readonly number[])[] = (() => {
  const idx = (r: number, c: number) => r * GRID + c;
  const range = [...Array(GRID).keys()];
  return [
    ...range.map((r) => range.map((c) => idx(r, c))),
    ...range.map((c) => range.map((r) => idx(r, c))),
    range.map((i) => idx(i, i)),
    range.map((i) => idx(i, GRID - 1 - i)),
  ];
})();

export function isMarked(cell: CardCell, called: ReadonlySet<string>): boolean {
  return cell === null || called.has(cell);
}

/** Every complete row, column, or diagonal, as lists of cell indexes. */
export function winningLines(card: readonly CardCell[], called: ReadonlySet<string>): number[][] {
  return LINES.filter((line) => line.every((i) => isMarked(card[i] ?? null, called))).map((l) => [...l]);
}
