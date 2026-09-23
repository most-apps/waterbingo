import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
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

describe("CardsPage", () => {
  it("renders the requested range of numbered cards", () => {
    renderAt("/cards?from=41&count=3");
    const cards = screen.getAllByRole("article");
    expect(cards.map((c) => c.getAttribute("aria-label"))).toEqual(["Bingo card 41", "Bingo card 42", "Bingo card 43"]);
    expect(screen.getByText("Card #0041")).toBeInTheDocument();
    expect(screen.getByText(/3 cards on 3 letter pages/)).toBeInTheDocument();
  });

  it("clamps silly URL values", () => {
    renderAt("/cards?from=-5&count=99999&per=7");
    expect(screen.getAllByRole("article")).toHaveLength(200);
    expect(screen.getByText("Card #0001")).toBeInTheDocument();
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

    renderAt("/cards?from=7&count=4&per=4");
    await user.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(buildCardsPdf).toHaveBeenCalledWith(expect.objectContaining({ perSheet: 4 }));
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("water-bingo-cards-0007-0010-4up.pdf");
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
  });
});
