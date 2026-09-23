import { useId, useMemo, useState } from "react";
import { TILE_IDS } from "../data/tiles";
import { EXAMPLE_CARD_ID, parseCardId } from "../lib/cardIds";
import { CELLS, cardLayout, isMarked, winningLines } from "../lib/cards";
import BingoCard from "./BingoCard";

/** Look up a printed card by its ID and show which squares the called tiles cover. */
export default function CardChecker({ called }: { called: readonly string[] }) {
  const inputId = useId();
  const hintId = useId();
  const [value, setValue] = useState("");
  const calledSet = useMemo(() => new Set(called), [called]);

  const parsed = parseCardId(value);
  const cardId = parsed.status === "ok" ? parsed.id : null;
  const cells = useMemo(() => (cardId ? cardLayout(cardId, TILE_IDS) : null), [cardId]);
  const lines = cells ? winningLines(cells, calledSet) : [];
  const winning = new Set(lines.flat());
  const marked = cells ? cells.filter((c) => c !== null && isMarked(c, calledSet)).length : 0;

  return (
    <div className="checker">
      <label htmlFor={inputId}>Card ID (printed at the bottom of the card)</label>
      <input
        id={inputId}
        className="input input-lg"
        type="text"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby={hintId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`e.g. ${EXAMPLE_CARD_ID.replaceAll("-", " ")}`}
        autoFocus
      />
      <p id={hintId} className="checker-hint">
        Type the three words, or just the first few letters of each.
      </p>
      {parsed.status === "error" && (
        <p className="checker-result is-error" role="alert">
          {parsed.message}
        </p>
      )}
      {cardId && cells && (
        <>
          <p className={`checker-result ${lines.length ? "is-win" : "is-miss"}`} role="status">
            {lines.length ? (
              <>
                BINGO! Card <span className="card-id">{cardId}</span> has{" "}
                {lines.length === 1 ? "a winning line" : `${lines.length} winning lines`}.
              </>
            ) : (
              <>
                No bingo yet — {marked} of {CELLS - 1} pictures called on card <span className="card-id">{cardId}</span>.
              </>
            )}
          </p>
          <BingoCard cardId={cardId} cells={cells} called={calledSet} winning={winning} variant="compact" />
        </>
      )}
    </div>
  );
}
