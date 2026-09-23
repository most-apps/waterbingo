import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { TILES, TILE_IDS } from "../data/tiles";
import { cardLayout } from "../lib/cards";
import CallerPage from "./CallerPage";

const renderCaller = () =>
  render(
    <MemoryRouter>
      <CallerPage />
    </MemoryRouter>,
  );

const callCount = () => document.querySelector(".call-count")?.textContent;

describe("CallerPage", () => {
  it("shows start and print buttons before a game", () => {
    renderCaller();
    expect(screen.getByRole("button", { name: "Start calling" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Print bingo cards" })).toHaveAttribute("href", "/cards");
    expect(screen.getByAltText(/Water Environment Protection/)).toBeInTheDocument();
  });

  it("calls tiles with buttons and keyboard, and steps back", async () => {
    const user = userEvent.setup();
    renderCaller();
    await user.click(screen.getByRole("button", { name: "Start calling" }));
    expect(callCount()).toBe(`Call 1 of ${TILES.length}`);

    await user.click(screen.getByRole("button", { name: "Next tile →" }));
    expect(callCount()).toBe(`Call 2 of ${TILES.length}`);

    (document.activeElement as HTMLElement).blur();
    await user.keyboard("{ArrowRight}");
    expect(callCount()).toBe(`Call 3 of ${TILES.length}`);

    await user.keyboard("{ArrowLeft}");
    expect(callCount()).toBe(`Call 2 of ${TILES.length}`);
  });

  it("does not double-advance when Space is pressed on the focused Next button", async () => {
    const user = userEvent.setup();
    renderCaller();
    await user.click(screen.getByRole("button", { name: "Start calling" }));
    screen.getByRole("button", { name: "Next tile →" }).focus();
    await user.keyboard(" ");
    expect(callCount()).toBe(`Call 2 of ${TILES.length}`);
  });

  it("restores the game after a reload", async () => {
    const user = userEvent.setup();
    const first = renderCaller();
    await user.click(screen.getByRole("button", { name: "Start calling" }));
    await user.click(screen.getByRole("button", { name: "Next tile →" }));
    first.unmount();

    renderCaller();
    expect(callCount()).toBe(`Call 2 of ${TILES.length}`);
  });

  it("stops at the last tile", async () => {
    const user = userEvent.setup();
    renderCaller();
    await user.click(screen.getByRole("button", { name: "Start calling" }));
    for (let i = 1; i < TILES.length; i++) await user.click(screen.getByRole("button", { name: "Next tile →" }));
    expect(screen.getByText("Every tile has been called!")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next tile →" })).not.toBeInTheDocument();
  });

  it("asks before starting a new game", async () => {
    const user = userEvent.setup();
    renderCaller();
    await user.click(screen.getByRole("button", { name: "Start calling" }));
    await user.click(screen.getByRole("button", { name: "New game" }));
    await user.click(screen.getByRole("button", { name: "Keep playing" }));
    expect(callCount()).toBe(`Call 1 of ${TILES.length}`);

    await user.click(screen.getByRole("button", { name: "New game" }));
    await user.click(screen.getByRole("button", { name: "Clear and start over" }));
    expect(screen.getByRole("button", { name: "Start calling" })).toBeInTheDocument();
  });

  it("checks a card once every tile is called", async () => {
    const user = userEvent.setup();
    renderCaller();
    await user.click(screen.getByRole("button", { name: "Start calling" }));
    await user.click(screen.getByRole("button", { name: "Check a card" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/Card number/), "7");
    expect(within(dialog).getByRole("status")).toHaveTextContent(/No bingo yet — [01] of 24/);
    expect(within(dialog).getByRole("article", { name: "Bingo card 7" })).toBeInTheDocument();
    expect(cardLayout(7, TILE_IDS)).toHaveLength(25);
  });
});
