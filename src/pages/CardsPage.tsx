import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import BingoCard from "../components/BingoCard";
import NumberField from "../components/NumberField";
import SiteHeader from "../components/SiteHeader";
import { TILE_IDS, getTile } from "../data/tiles";
import { EXAMPLE_CARD_ID, randomCardIds } from "../lib/cardIds";
import { cardLayout } from "../lib/cards";
import { PER_SHEET_OPTIONS, paginate, parsePerSheet, sheetSpec, type PerSheet } from "../lib/sheetLayout";
import "./cards.css";

const MAX_BATCH = 200;
const DEFAULT_COUNT = 30;

function clampInt(raw: string | null, fallback: number, min: number, max: number) {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, n));
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function CardsPage() {
  const [params, setParams] = useSearchParams();
  const [pdfState, setPdfState] = useState<"idle" | "busy" | "error">("idle");

  const count = clampInt(params.get("count"), DEFAULT_COUNT, 1, MAX_BATCH);
  const per = parsePerSheet(params.get("per"));

  // Fresh random IDs on every visit (never in the URL, so a bookmark can't reprint
  // old cards). Raising the count adds IDs and keeps the ones already shown.
  const [ids, setIds] = useState(() => randomCardIds(count));
  if (ids.length < count) setIds([...ids, ...randomCardIds(count - ids.length, ids)]);

  const cards = useMemo(
    () => ids.slice(0, count).map((id) => ({ id, cells: cardLayout(id, TILE_IDS) })),
    [ids, count],
  );
  const sheets = paginate(cards, per);

  const update = (key: "count" | "per", value: number) =>
    setParams(
      (p) => {
        p.set(key, String(value));
        return p;
      },
      { replace: true },
    );

  const downloadPdf = async () => {
    setPdfState("busy");
    try {
      const { buildCardsPdf } = await import("../lib/cardsPdf");
      const bytes = await buildCardsPdf({ cards, perSheet: per, getTile });
      const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `water-bingo-${plural(count, "card")}-${per}up.pdf`.replaceAll(" ", "-");
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setPdfState("idle");
    } catch (err) {
      console.error(err);
      setPdfState("error");
    }
  };

  return (
    <div className="cards-page">
      <div className="no-print">
        <SiteHeader>
          <Link to="/" className="btn btn-ghost">
            ← Back to caller
          </Link>
        </SiteHeader>

        <section className="print-panel" aria-labelledby="print-title">
          <div>
            <h1 id="print-title">Print bingo cards</h1>
            <p>
              Every card gets its own random ID, like <strong>{EXAMPLE_CARD_ID}</strong>, and the same ID always has
              the same pictures. Cards left over from earlier events keep working, and new cards won’t repeat them. To
              check a card, type its ID into the caller screen.
            </p>
          </div>

          <div className="print-form">
            <NumberField label="How many cards" value={count} min={1} max={MAX_BATCH} onCommit={(n) => update("count", n)} />
            <fieldset className="per-sheet">
              <legend>Cards per page</legend>
              <div className="per-sheet-options">
                {PER_SHEET_OPTIONS.map((n) => (
                  <label key={n} className="per-sheet-option">
                    <input
                      type="radio"
                      name="per-sheet"
                      value={n}
                      checked={per === n}
                      onChange={() => update("per", n)}
                    />
                    <PageIcon per={n} />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="print-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={downloadPdf} disabled={pdfState === "busy"}>
              {pdfState === "busy" ? "Building PDF…" : "Download PDF"}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => window.print()}>
              Print
            </button>
            <p className="print-summary" aria-live="polite">
              {plural(count, "card")} on{" "}
              {plural(sheets.length, "letter page")}
              {sheetSpec(per).orientation === "landscape" ? " (landscape)" : ""}.
            </p>
          </div>
          {pdfState === "error" && (
            <p className="print-error" role="alert">
              Couldn’t build the PDF. Try again, or use Print instead.
            </p>
          )}
          <p className="print-tip">
            The PDF has no browser headers, footers or web address — best for sharing or a print shop. Print at 100% /
            “Actual size”. Download PDF and Print both use the cards shown below; reloading this page makes a new set.
          </p>
        </section>
      </div>

      <div className="sheets">
        {sheets.map((sheet, i) => (
          <div key={i} className={`sheet-frame sheet-frame--${sheetSpec(per).orientation}`}>
            <section className={`sheet sheet--${per}`} aria-label={`Page ${i + 1}`}>
              {sheet.map(({ id, cells }) => (
                <div key={id} className="sheet-slot">
                  <BingoCard cardId={id} cells={cells} />
                </div>
              ))}
            </section>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageIcon({ per }: { per: PerSheet }) {
  const landscape = sheetSpec(per).orientation === "landscape";
  const [w, h] = landscape ? [30, 22] : [22, 30];
  const cells =
    per === 1
      ? [[4, 4, w - 8, h - 8]]
      : per === 2
        ? [
            [3, 4, w / 2 - 4.5, h - 8],
            [w / 2 + 1.5, 4, w / 2 - 4.5, h - 8],
          ]
        : [
            [3, 3, w / 2 - 4.5, h / 2 - 4.5],
            [w / 2 + 1.5, 3, w / 2 - 4.5, h / 2 - 4.5],
            [3, h / 2 + 1.5, w / 2 - 4.5, h / 2 - 4.5],
            [w / 2 + 1.5, h / 2 + 1.5, w / 2 - 4.5, h / 2 - 4.5],
          ];
  return (
    <svg className="page-icon" viewBox={`-1 -1 ${w + 2} ${h + 2}`} width={w + 2} height={h + 2} aria-hidden="true">
      <rect width={w} height={h} rx="2" fill="#fff" stroke="currentColor" strokeWidth="1.5" />
      {cells.map(([x, y, cw, ch], i) => (
        <rect key={i} x={x} y={y} width={cw} height={ch} rx="1" fill="currentColor" opacity=".35" />
      ))}
    </svg>
  );
}
