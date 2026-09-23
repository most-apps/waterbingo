import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import mostLogo from "../assets/brand/most-logo.png";
import { FREE_INDEX, GRID, type CardCell } from "./cards";
import { cardRect, paginate, sheetSpec, slotRects, wrapText, type PerSheet, type Rect } from "./sheetLayout";

/**
 * Builds the printable cards as a PDF entirely in the browser, so the output
 * has no browser-added header, footer, URL or date. Loaded lazily (pdf-lib is large).
 */

export interface PdfTile {
  id: string;
  short: string;
  image: string;
}

export interface PdfCard {
  id: string;
  cells: readonly CardCell[];
}

export interface BuildOptions {
  cards: readonly PdfCard[];
  perSheet: PerSheet;
  getTile: (id: string) => PdfTile;
  loadImage?: (url: string) => Promise<ArrayBuffer | Uint8Array>;
}

const hex = (h: string) =>
  rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

// Mirrors the tokens in src/index.css.
const BLUE = hex("#0257b7");
const BLUE_SOFT = hex("#e3eefb");
const GREEN = hex("#1e722d");
const PINK = hex("#df068c");
const INK = hex("#0e1a2b");
const CELL_LINE = hex("#9fb3cc");
const CUT_LINE = hex("#b8c4d4");

const DROP_PATH = "M32 4C32 4 12 28 12 42a20 20 0 0 0 40 0C52 28 32 4 32 4z";
const SUBTITLE = "IN PARTNERSHIP WITH ONONDAGA COUNTY WATER ENVIRONMENT PROTECTION";
/** Footer, in `u`: card ID left, MOST logo right. */
export const FOOTER = { idLabel: "Card ID: ", idSize: 3, logoHeight: 3.6, gap: 1.5 };
/** Caption under FREE in the centre square, in bold at `size` u. */
export const FREE_CAPTION = { text: "Five in a row wins!", size: 1.7 };
export const MOST_LOGO_ASPECT = 2081 / 672; // most-logo.png

const defaultLoad = async (url: string) => (await fetch(url)).arrayBuffer();

export async function buildCardsPdf({ cards, perSheet, getTile, loadImage = defaultLoad }: BuildOptions) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Water Bingo cards (${cards.length})`);
  doc.setAuthor("Museum of Science & Technology (MOST)");
  doc.setSubject("In partnership with Onondaga County Department of Water Environment Protection");
  doc.setCreator("Water Bingo");

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Embed each tile image once; every card reuses it.
  const ids = new Set(cards.flatMap((c) => c.cells.filter((x): x is string => x !== null)));
  const images = new Map<string, PDFImage>();
  await Promise.all(
    [...ids].map(async (id) => {
      const bytes = await loadImage(getTile(id).image);
      images.set(id, await doc.embedPng(bytes));
    }),
  );

  const logo = await doc.embedPng(await loadImage(mostLogo));

  const spec = sheetSpec(perSheet);
  const slots = slotRects(perSheet);
  for (const pageCards of paginate(cards, perSheet)) {
    const page = doc.addPage([spec.width, spec.height]);
    drawCutLines(page, perSheet);
    pageCards.forEach((card, i) => drawCard(page, cardRect(slots[i]!), card, { bold, images, logo, getTile }));
  }

  return doc.save();
}

interface DrawContext {
  bold: PDFFont;
  images: Map<string, PDFImage>;
  logo: PDFImage;
  getTile: (id: string) => PdfTile;
}

function drawCutLines(page: PDFPage, per: PerSheet) {
  const { width, height } = page.getSize();
  const style = { thickness: 0.5, color: CUT_LINE, dashArray: [4, 4] };
  if (per >= 2) page.drawLine({ start: { x: width / 2, y: 0 }, end: { x: width / 2, y: height }, ...style });
  if (per === 4) page.drawLine({ start: { x: 0, y: height / 2 }, end: { x: width, y: height / 2 }, ...style });
}

/** Everything is laid out in `u` = 1% of card width, top-down, then flipped to PDF coordinates. */
function drawCard(page: PDFPage, box: Rect, card: PdfCard, ctx: DrawContext) {
  const pageH = page.getSize().height;
  const u = box.w / 100;
  const X = (x: number) => box.x + x * u;
  const Y = (y: number) => pageH - (box.y + y * u); // top-down → PDF bottom-up
  const { bold } = ctx;

  // Header: drop + title, centred as one group.
  const title = "WATER BINGO";
  const titleSize = 8 * u;
  const dropSize = 7 * u; // rendered height of the 64-unit drop path
  const titleW = bold.widthOfTextAtSize(title, titleSize);
  const groupW = dropSize * 0.66 + 1.5 * u + titleW;
  const gx = box.x + (box.w - groupW) / 2;
  page.drawSvgPath(DROP_PATH, { x: gx - dropSize * 0.18, y: Y(0.4), scale: dropSize / 64, color: BLUE });
  page.drawText(title, { x: gx + dropSize * 0.66 + 1.5 * u, y: Y(7.6), size: titleSize, font: bold, color: BLUE });

  const subSize = 2.1 * u;
  const subW = bold.widthOfTextAtSize(SUBTITLE, subSize);
  page.drawText(SUBTITLE, { x: box.x + (box.w - subW) / 2, y: Y(11.4), size: subSize, font: bold, color: GREEN });

  // Grid.
  const top = 14;
  const cell = 100 / GRID;
  card.cells.forEach((c, i) => {
    const cx = (i % GRID) * cell;
    const cy = top + Math.floor(i / GRID) * cell;
    if (i === FREE_INDEX) drawFree(page, X, Y, u, cx, cy, cell, bold);
    else if (c !== null) drawTile(page, X, Y, u, cx, cy, cell, ctx.getTile(c).short, ctx.images.get(c)!, bold);
  });
  for (let k = 1; k < GRID; k++) {
    const line = { thickness: 0.25 * u, color: CELL_LINE };
    page.drawLine({ start: { x: X(k * cell), y: Y(top) }, end: { x: X(k * cell), y: Y(top + 100) }, ...line });
    page.drawLine({ start: { x: X(0), y: Y(top + k * cell) }, end: { x: X(100), y: Y(top + k * cell) }, ...line });
  }
  page.drawRectangle({ x: X(0), y: Y(top + 100), width: 100 * u, height: 100 * u, borderColor: BLUE, borderWidth: 0.7 * u });

  // Footer, centred on y = 117.5u: "Card ID: <id>" left (ID in pink), MOST logo right.
  const idSize = FOOTER.idSize;
  const labelW = bold.widthOfTextAtSize(FOOTER.idLabel, idSize);
  page.drawText(FOOTER.idLabel, { x: X(0), y: Y(118.6), size: idSize * u, font: bold, color: INK });
  page.drawText(card.id, { x: X(labelW), y: Y(118.6), size: idSize * u, font: bold, color: PINK });

  const logoH = FOOTER.logoHeight;
  const logoW = logoH * MOST_LOGO_ASPECT;
  page.drawImage(ctx.logo, { x: X(100 - logoW), y: Y(117.5 + logoH / 2), width: logoW * u, height: logoH * u });
}

type Coord = (v: number) => number;

function drawTile(
  page: PDFPage,
  X: Coord,
  Y: Coord,
  u: number,
  cx: number,
  cy: number,
  cell: number,
  label: string,
  image: PDFImage,
  font: PDFFont,
) {
  const pad = 1.2;
  const maxW = (cell - 2 * pad) * u;

  // Largest label size (2.4u down to 1.5u) that fits on ≤2 lines without breaking words.
  let sizeU = 2.4;
  let lines = wrapText(label, maxW, 2, (t) => font.widthOfTextAtSize(t, sizeU * u));
  while (!lines && sizeU > 1.5) {
    sizeU -= 0.1;
    lines = wrapText(label, maxW, 2, (t) => font.widthOfTextAtSize(t, sizeU * u));
  }
  lines ??= [label];
  const lineHU = sizeU * 1.1;
  const labelTopU = cy + cell - pad - lines.length * lineHU;
  lines.forEach((line, i) => {
    const w = font.widthOfTextAtSize(line, sizeU * u);
    const baselineU = labelTopU + (i + 1) * lineHU - lineHU * 0.22;
    page.drawText(line, { x: X(cx + cell / 2) - w / 2, y: Y(baselineU), size: sizeU * u, font, color: INK });
  });

  // Image: contain-fit in the space above the label.
  const areaTopU = cy + pad;
  const areaHU = labelTopU - 0.6 - areaTopU;
  const scale = Math.min(maxW / image.width, (areaHU * u) / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  const imageTopU = areaTopU + (areaHU - h / u) / 2;
  page.drawImage(image, { x: X(cx + cell / 2) - w / 2, y: Y(imageTopU) - h, width: w, height: h });
}

function drawFree(page: PDFPage, X: Coord, Y: Coord, u: number, cx: number, cy: number, cell: number, font: PDFFont) {
  page.drawRectangle({ x: X(cx), y: Y(cy + cell), width: cell * u, height: cell * u, color: BLUE_SOFT });
  const drop = 7.5 * u;
  page.drawSvgPath(DROP_PATH, { x: X(cx + cell / 2) - drop / 2, y: Y(cy + 1.8), scale: drop / 64, color: BLUE });
  const size = 3.4 * u;
  const w = font.widthOfTextAtSize("FREE", size);
  page.drawText("FREE", { x: X(cx + cell / 2) - w / 2, y: Y(cy + 13.4), size, font, color: BLUE });
  const capSize = FREE_CAPTION.size * u;
  const capW = font.widthOfTextAtSize(FREE_CAPTION.text, capSize);
  page.drawText(FREE_CAPTION.text, { x: X(cx + cell / 2) - capW / 2, y: Y(cy + 17.4), size: capSize, font, color: BLUE });
}
