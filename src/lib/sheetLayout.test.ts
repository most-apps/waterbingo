import { describe, expect, it } from "vitest";
import {
  CARD_ASPECT,
  PAGE_MARGIN,
  PER_SHEET_OPTIONS,
  cardRect,
  paginate,
  parsePerSheet,
  sheetSpec,
  slotRects,
  wrapText,
} from "./sheetLayout";

describe("sheet layout", () => {
  it.each(PER_SHEET_OPTIONS)("%i-up: slots stay inside the page margins and cards inside their slots", (per) => {
    const { width, height } = sheetSpec(per);
    const slots = slotRects(per);
    expect(slots).toHaveLength(per);
    for (const s of slots) {
      expect(s.x).toBeGreaterThanOrEqual(PAGE_MARGIN - 1e-9);
      expect(s.y).toBeGreaterThanOrEqual(PAGE_MARGIN - 1e-9);
      expect(s.x + s.w).toBeLessThanOrEqual(width - PAGE_MARGIN + 1e-9);
      expect(s.y + s.h).toBeLessThanOrEqual(height - PAGE_MARGIN + 1e-9);
      const c = cardRect(s);
      expect(c.h / c.w).toBeCloseTo(CARD_ASPECT);
      expect(c.x).toBeGreaterThanOrEqual(s.x - 1e-9);
      expect(c.y + c.h).toBeLessThanOrEqual(s.y + s.h + 1e-9);
    }
  });

  it("uses landscape for 2-up and portrait otherwise", () => {
    expect(sheetSpec(1).orientation).toBe("portrait");
    expect(sheetSpec(2).orientation).toBe("landscape");
    expect(sheetSpec(4).orientation).toBe("portrait");
  });

  it("paginates with a short last page", () => {
    expect(paginate([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(paginate([1, 2, 3], 4)).toEqual([[1, 2, 3]]);
  });

  it("parses the per-sheet URL value, defaulting to 1", () => {
    expect(parsePerSheet("4")).toBe(4);
    expect(parsePerSheet("3")).toBe(1);
    expect(parsePerSheet(null)).toBe(1);
  });
});

describe("wrapText", () => {
  const measure = (s: string) => s.length; // 1 unit per character

  it("wraps on word boundaries", () => {
    expect(wrapText("Benedict Rd Pump Station", 12, 2, measure)).toEqual(["Benedict Rd", "Pump Station"]);
  });

  it("returns null when it needs too many lines or a word is too long", () => {
    expect(wrapText("one two three four", 5, 2, measure)).toBeNull();
    expect(wrapText("Microorganisms", 8, 2, measure)).toBeNull();
  });
});
