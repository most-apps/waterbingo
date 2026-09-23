// @vitest-environment node
/// <reference types="node" />
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { TILE_IDS, getTile } from "../data/tiles";
import { ADJECTIVES, NOUNS, randomCardIds } from "./cardIds";
import { cardLayout } from "./cards";
import { FOOTER, FOOTER_SIZE, buildCardsPdf } from "./cardsPdf";
import { mulberry32 } from "./random";
import type { PerSheet } from "./sheetLayout";

// In tests, Vite resolves tile images to "/src/assets/tiles/<id>.png"; read them from disk.
const loadImage = (url: string) => readFile(resolve(process.cwd(), `.${url.split("?")[0]}`));

const cards = (count: number) =>
  randomCardIds(count, [], mulberry32(count)).map((id) => ({ id, cells: cardLayout(id, TILE_IDS) }));

describe("buildCardsPdf", () => {
  it.each([
    [1, 5, 5, 612, 792],
    [2, 5, 3, 792, 612],
    [4, 5, 2, 612, 792],
  ] as const)("%i per page: %i cards → %i letter pages", async (per, count, pages, w, h) => {
    const bytes = await buildCardsPdf({ cards: cards(count), perSheet: per as PerSheet, getTile, loadImage });
    if (process.env.DUMP_PDF) await writeFile(`${process.env.DUMP_PDF}/cards-${per}up.pdf`, bytes);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(pages);
    expect(doc.getPage(0).getSize()).toEqual({ width: w, height: h });
    expect(doc.getTitle()).toBe(`Water Bingo cards (${count})`);
  });

  it("fits the widest possible card ID beside the footer text", async () => {
    const doc = await PDFDocument.create();
    const [regular, bold] = await Promise.all([
      doc.embedFont(StandardFonts.Helvetica),
      doc.embedFont(StandardFonts.HelveticaBold),
    ]);
    const widest = (list: readonly string[]) =>
      [...list].sort((a, b) => bold.widthOfTextAtSize(b, 1) - bold.widthOfTextAtSize(a, 1));
    const [a1, a2] = widest(ADJECTIVES);
    const id = `Card ${a1}-${a2}-${widest(NOUNS)[0]}`;
    // Widths in u (1% of card width); 2u gap between the two, as in the CSS.
    const used = regular.widthOfTextAtSize(FOOTER, FOOTER_SIZE.text) + 2 + bold.widthOfTextAtSize(id, FOOTER_SIZE.id);
    expect(used).toBeLessThan(98);
  });
});
