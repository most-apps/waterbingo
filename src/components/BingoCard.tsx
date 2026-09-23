import { FREE_INDEX, isMarked, type CardCell } from "../lib/cards";
import { getTile } from "../data/tiles";
import WaterDrop from "./WaterDrop";

interface Props {
  cardId: string;
  cells: readonly CardCell[];
  /** When given, called cells are marked (used by the card checker). */
  called?: ReadonlySet<string>;
  winning?: ReadonlySet<number>;
  variant?: "print" | "compact";
}

export default function BingoCard({ cardId, cells, called, winning, variant = "print" }: Props) {
  return (
    <article className={`bingo-card bingo-card--${variant}`} aria-label={`Bingo card ${cardId}`}>
      {variant === "print" && (
        <header className="bingo-card-head">
          <h2>
            <WaterDrop className="bingo-card-drop" /> Water Bingo
          </h2>
          <p>Onondaga County Department of Water Environment Protection</p>
        </header>
      )}
      <ol className="bingo-grid">
        {cells.map((cell, i) => {
          const marked = called ? isMarked(cell, called) : false;
          const classes = [
            "bingo-cell",
            i === FREE_INDEX && "bingo-cell--free",
            marked && "is-marked",
            winning?.has(i) && "is-winning",
          ]
            .filter(Boolean)
            .join(" ");
          if (cell === null) {
            return (
              <li key="free" className={classes}>
                <WaterDrop className="free-drop" />
                <span className="bingo-cell-label">FREE</span>
              </li>
            );
          }
          const tile = getTile(cell);
          return (
            <li key={cell} className={classes}>
              <img src={tile.image} alt="" />
              <span className="bingo-cell-label">{tile.short}</span>
            </li>
          );
        })}
      </ol>
      {variant === "print" && (
        <footer className="bingo-card-foot">
          <span>Mark each picture when it’s called. Five in a row wins!</span>
          <strong>Card {cardId}</strong>
        </footer>
      )}
    </article>
  );
}
