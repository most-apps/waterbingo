import { useId, useMemo, useState } from "react";
import { TILE_IDS } from "../data/tiles";
import { CELLS, MAX_CARD_NUMBER, cardLayout, formatCardNumber, isMarked, winningLines } from "../lib/cards";
import BingoCard from "./BingoCard";

/** Look up a printed card by number and show which squares the called tiles cover. */
export default function CardChecker({ called }: { called: readonly string[] }) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const calledSet = useMemo(() => new Set(called), [called]);

  const cardNumber = Number(value);
  const valid = value !== "" && Number.isInteger(cardNumber) && cardNumber >= 1 && cardNumber <= MAX_CARD_NUMBER;
  const cells = useMemo(() => (valid ? cardLayout(cardNumber, TILE_IDS) : null), [valid, cardNumber]);
  const lines = cells ? winningLines(cells, calledSet) : [];
  const winning = new Set(lines.flat());
  const marked = cells ? cells.filter((c) => c !== null && isMarked(c, calledSet)).length : 0;

  return (
    <div className="checker">
      <label htmlFor={inputId}>Card number (printed at the bottom of the card)</label>
      <input
        id={inputId}
        className="input input-lg"
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_CARD_NUMBER}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. 12"
        autoFocus
      />
      {value !== "" && !valid && (
        <p className="checker-result is-error" role="alert">
          Enter a whole number from 1 to {MAX_CARD_NUMBER}.
        </p>
      )}
      {cells && (
        <>
          <p className={`checker-result ${lines.length ? "is-win" : "is-miss"}`} role="status">
            {lines.length
              ? `BINGO! Card ${formatCardNumber(cardNumber)} has ${lines.length === 1 ? "a winning line" : `${lines.length} winning lines`}.`
              : `No bingo yet — ${marked} of ${CELLS - 1} pictures called.`}
          </p>
          <BingoCard cardNumber={cardNumber} cells={cells} called={calledSet} winning={winning} variant="compact" />
        </>
      )}
    </div>
  );
}
