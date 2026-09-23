/**
 * Page geometry for printed cards, in PDF points (1in = 72pt), origin top-left.
 * Used by the PDF builder; the print CSS in pages/cards.css mirrors these numbers.
 */

export const PER_SHEET_OPTIONS = [1, 2, 4] as const;
export type PerSheet = (typeof PER_SHEET_OPTIONS)[number];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const INCH = 72;
export const PAGE_MARGIN = 0.4 * INCH;
export const GUTTER = 0.4 * INCH;

/** Card height as a multiple of its width (header + 5×5 grid + footer). */
export const CARD_ASPECT = 1.2;

interface SheetSpec {
  orientation: "portrait" | "landscape";
  width: number;
  height: number;
  cols: number;
  rows: number;
}

export function sheetSpec(per: PerSheet): SheetSpec {
  // 2-up goes landscape side by side: each card is ~25% wider than stacking two on a portrait page.
  if (per === 2) return { orientation: "landscape", width: 11 * INCH, height: 8.5 * INCH, cols: 2, rows: 1 };
  const grid = per === 4 ? 2 : 1;
  return { orientation: "portrait", width: 8.5 * INCH, height: 11 * INCH, cols: grid, rows: grid };
}

/** The area each card may occupy on a page, left-to-right then top-to-bottom. */
export function slotRects(per: PerSheet): Rect[] {
  const { width, height, cols, rows } = sheetSpec(per);
  const w = (width - 2 * PAGE_MARGIN - (cols - 1) * GUTTER) / cols;
  const h = (height - 2 * PAGE_MARGIN - (rows - 1) * GUTTER) / rows;
  const out: Rect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ x: PAGE_MARGIN + c * (w + GUTTER), y: PAGE_MARGIN + r * (h + GUTTER), w, h });
    }
  }
  return out;
}

/** The largest card that fits in a slot, centred. */
export function cardRect(slot: Rect): Rect {
  const w = Math.min(slot.w, slot.h / CARD_ASPECT);
  const h = w * CARD_ASPECT;
  return { x: slot.x + (slot.w - w) / 2, y: slot.y + (slot.h - h) / 2, w, h };
}

export function paginate<T>(items: readonly T[], per: PerSheet): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += per) pages.push(items.slice(i, i + per));
  return pages;
}

export function parsePerSheet(raw: string | null): PerSheet {
  const n = Number(raw);
  return (PER_SHEET_OPTIONS as readonly number[]).includes(n) ? (n as PerSheet) : 1;
}

/**
 * Greedy word wrap. Returns null if it can't fit in `maxLines` without
 * breaking a word, so the caller can try a smaller font size.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  maxLines: number,
  measure: (s: string) => number,
): string[] | null {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (!line || measure(word) > maxWidth) return null;
    lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines.length <= maxLines ? lines : null;
}
