import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import mostLogo from "../assets/brand/most-logo.png";
import wepLogo from "../assets/brand/wep-logo.png";
import CardChecker from "../components/CardChecker";
import Dialog from "../components/Dialog";
import SiteHeader from "../components/SiteHeader";
import WaterDrop from "../components/WaterDrop";
import { TILES, getTile } from "../data/tiles";
import { useFullscreen } from "../hooks/useFullscreen";
import { useGame } from "../hooks/useGame";
import { useWakeLock } from "../hooks/useWakeLock";
import { CELLS } from "../lib/cards";
import { calledIds, currentId, isFinished, isStarted } from "../lib/game";
import "./caller.css";

const BOARD = [...TILES].sort((a, b) => a.label.localeCompare(b.label));

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]") !== null;
}

export default function CallerPage() {
  const { state, start, next, undo, reset } = useGame();
  const fullscreen = useFullscreen();
  const [dialog, setDialog] = useState<"check" | "reset" | null>(null);

  const started = isStarted(state);
  const finished = isFinished(state);
  const current = currentId(state);
  const called = useMemo(() => calledIds(state), [state]);
  const callNumber = useMemo(() => new Map(called.map((id, i) => [id, i + 1])), [called]);

  useWakeLock(started);

  // Keyboard + presentation-clicker controls. Clickers send PageDown/PageUp or arrows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || dialog || isTyping(e.target)) return;
      // Let Space/Enter activate whatever button has focus instead of double-firing.
      const onControl = e.target instanceof HTMLElement && e.target.closest("button, a") !== null;
      switch (e.key) {
        case " ":
        case "Enter":
          if (onControl) return;
          if (started) next();
          else start();
          break;
        case "ArrowRight":
        case "PageDown":
          if (started) next();
          break;
        case "ArrowLeft":
        case "PageUp":
          if (started) undo();
          break;
        case "f":
        case "F":
          fullscreen.toggle();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, started, next, undo, start, fullscreen]);

  // Preload the next tile so it appears instantly.
  useEffect(() => {
    const upcoming = state.order[state.calledCount];
    if (upcoming) new Image().src = getTile(upcoming).image;
  }, [state]);

  if (!started) return <StartScreen onStart={start} />;

  const tile = current ? getTile(current) : undefined;

  return (
    <div className="caller">
      <SiteHeader>
        <button type="button" className="btn btn-ghost" onClick={() => setDialog("check")}>
          Check a card
        </button>
        <Link to="/cards" className="btn btn-ghost">
          Print cards
        </Link>
        {fullscreen.supported && (
          <button type="button" className="btn btn-ghost" onClick={fullscreen.toggle} aria-keyshortcuts="F">
            {fullscreen.isFullscreen ? "Exit full screen" : "Full screen"}
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-danger" onClick={() => setDialog("reset")}>
          New game
        </button>
      </SiteHeader>

      <main className="caller-main">
        <section className="stage" aria-labelledby="current-call">
          <p className="call-count">
            Call <strong>{state.calledCount}</strong> of {state.order.length}
          </p>
          {tile && (
            <figure className="stage-tile" key={tile.id}>
              <div className="stage-image">
                <img src={tile.image} alt="" />
              </div>
              <figcaption id="current-call" className="stage-label">
                {tile.label}
              </figcaption>
            </figure>
          )}
          <p className="visually-hidden" aria-live="assertive">
            {tile && `Call ${state.calledCount}: ${tile.label}`}
            {finished && ". That was the last tile."}
          </p>
          <div className="stage-controls">
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={undo}
              disabled={state.calledCount <= 1}
              aria-keyshortcuts="ArrowLeft"
            >
              ← Back
            </button>
            {finished ? (
              <p className="stage-done">Every tile has been called!</p>
            ) : (
              <button type="button" className="btn btn-primary btn-xl" onClick={next} aria-keyshortcuts="Space ArrowRight">
                Next tile →
              </button>
            )}
          </div>
          <p className="hint">
            <kbd>Space</kbd> or <kbd>→</kbd> next · <kbd>←</kbd> back · <kbd>F</kbd> full screen
          </p>
        </section>

        <section className="board" aria-labelledby="board-title">
          <h2 id="board-title">
            Called so far <span className="board-count">{called.length}</span>
          </h2>
          <ul className="board-grid">
            {BOARD.map((t) => {
              const n = callNumber.get(t.id);
              return (
                <li key={t.id} title={t.label} className={`board-tile${n ? " is-called" : ""}${t.id === current ? " is-current" : ""}`}>
                  <img src={t.image} alt="" loading="lazy" />
                  <span className="board-label">{t.short}</span>
                  {n ? <span className="board-badge">{n}</span> : <span className="visually-hidden">not called</span>}
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <Dialog open={dialog === "check"} title="Check a card" onClose={() => setDialog(null)}>
        <CardChecker called={called} />
      </Dialog>

      <Dialog open={dialog === "reset"} title="Start a new game?" onClose={() => setDialog(null)}>
        <p>This clears all {called.length} calls from the current game. Printed cards still work.</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDialog(null)} autoFocus>
            Keep playing
          </button>
          <button
            type="button"
            className="btn btn-danger-solid"
            onClick={() => {
              setDialog(null);
              reset();
            }}
          >
            Clear and start over
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="start">
      <SiteHeader />
      <main className="start-main">
        <WaterDrop className="start-drop" />
        <h1>Water Bingo</h1>
        <p className="start-lede">
          Learn what happens after the flush — from pipes and pump stations to the treatment plants that clean
          Onondaga County’s water.
        </p>
        <div className="start-actions">
          <button type="button" className="btn btn-primary btn-xl" onClick={onStart} autoFocus>
            Start calling
          </button>
          <Link to="/cards" className="btn btn-secondary btn-xl">
            Print bingo cards
          </Link>
        </div>
        <ol className="steps">
          <li>
            <strong>Print cards.</strong> Each card has its own word ID and mix of {CELLS - 1} pictures.
          </li>
          <li>
            <strong>Call tiles.</strong> Press <kbd>Space</kbd> to show the next picture and read its name aloud.
          </li>
          <li>
            <strong>Check winners.</strong> Five in a row wins — enter their card ID to confirm.
          </li>
        </ol>
        {/* Decorative: the header already names both organisations. */}
        <div className="partner-band">
          <img className="partner-band-most" src={mostLogo} alt="" />
          <img src={wepLogo} alt="" />
        </div>
      </main>
    </div>
  );
}
