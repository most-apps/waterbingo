// @vitest-environment node
/// <reference types="node" />
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { TILE_IDS, getTile } from "../data/tiles";
import { cardLayout } from "./cards";
import { buildCardsPdf } from "./cardsPdf";
import type { PerSheet } from "./sheetLayout";

// In tests, Vite resolves tile images to "/src/assets/tiles/<id>.png"; read them from disk.
const loadImage = (url: string) => readFile(resolve(process.cwd(), `.${url.split("?")[0]}`));

const cards = (count: number) => Array.from({ length: count }, (_, i) => ({ n: i + 1, cells: cardLayout(i + 1, TILE_IDS) }));

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
    expect(doc.getTitle()).toBe(`Water Bingo cards #0001–#000${count}`);
  });
});
