import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { isCardId } from "../lib/cardIds";
import CardsPage from "./CardsPage";

const buildCardsPdf = vi.fn(async () => new Uint8Array([37, 80, 68, 70]));
vi.mock("../lib/cardsPdf", () => ({ buildCardsPdf }));

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <CardsPage />
    </MemoryRouter>,
  );

const pageCount = () => screen.getAllByRole("region", { name: /^Page \d+$/ }).length;
const cardIds = () => screen.getAllByRole("article").map((c) => c.getAttribute("aria-label")?.replace("Bingo card ", ""));

describe("CardsPage", () => {
  it("gives each card its own word ID", () => {
    renderAt("/cards?count=3");
    const ids = cardIds();
    expect(ids).toHaveLength(3);
    for (const id of ids) {
      expect(isCardId(id ?? "")).toBe(true);
      expect(screen.getByText(id ?? "")).toHaveClass("card-id");
    }
    expect(new Set(ids).size).toBe(3);
    expect(screen.getByText(/3 cards on 3 letter pages/)).toBeInTheDocument();
  });

  it("makes a new set of cards on each visit", () => {
    const { unmount } = renderAt("/cards?count=5");
    const first = cardIds();
    unmount();
    renderAt("/cards?count=5");
    expect(cardIds()).not.toEqual(first);
  });

  it("keeps the cards already shown when the count or layout changes", async () => {
    const user = userEvent.setup();
    renderAt("/cards?count=2");
    const before = cardIds();

    const field = screen.getByLabelText("How many cards");
    await user.clear(field);
    await user.type(field, "4");
    await user.tab();
    expect(cardIds()).toHaveLength(4);
    expect(cardIds().slice(0, 2)).toEqual(before);

    await user.click(screen.getByRole("radio", { name: "4" }));
    expect(cardIds().slice(0, 2)).toEqual(before);
  });

  it("clamps silly URL values", () => {
    renderAt("/cards?count=99999&per=7");
    expect(screen.getAllByRole("article")).toHaveLength(200);
    expect(screen.getByRole("radio", { name: "1" })).toBeChecked();
  });

  it("puts a FREE square in the middle of every card", () => {
    renderAt("/cards?count=2");
    expect(screen.getAllByText("FREE")).toHaveLength(2);
  });

  it("groups cards 1, 2 or 4 to a page", async () => {
    const user = userEvent.setup();
    renderAt("/cards?count=5");
    expect(pageCount()).toBe(5);

    await user.click(screen.getByRole("radio", { name: "2" }));
    expect(pageCount()).toBe(3);
    expect(screen.getByText(/5 cards on 3 letter pages \(landscape\)/)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "4" }));
    expect(pageCount()).toBe(2);
  });

  it("downloads a PDF with the chosen layout", async () => {
    const user = userEvent.setup();
    URL.createObjectURL = vi.fn(() => "blob:cards");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderAt("/cards?count=4&per=4");
    const shown = cardIds();
    await user.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(buildCardsPdf).toHaveBeenCalledWith(expect.objectContaining({ perSheet: 4 }));
    const [[{ cards }]] = buildCardsPdf.mock.calls as unknown as [[{ cards: { id: string }[] }]];
    expect(cards.map((c) => c.id)).toEqual(shown);
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("water-bingo-4-cards-4up.pdf");
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
  });
});
