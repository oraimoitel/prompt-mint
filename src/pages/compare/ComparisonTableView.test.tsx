import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComparisonTableView, LetterAvatar } from "./ComparisonTableView";

type PromptOverrides = Partial<{
  id: string;
  title: string;
  creator: string;
  price: number;
  category: string;
  rating: number;
  salesCount: number;
  tags: string[];
  licenseType: string;
  isOwned: boolean;
  preview: string;
  creatorName: string;
}>;

const makePrompt = (overrides: PromptOverrides = {}): {
  id: string;
  title: string;
  creator: string;
  price: number;
  category: string;
  rating: number;
  salesCount: number;
  tags: string[];
  licenseType: string;
  isOwned: boolean;
  preview: string;
  creatorName?: string;
} => ({
  id: "1",
  title: "Prompt One",
  creator: "GCreatorAddress1234567890",
  price: 5,
  category: "Marketing",
  rating: 4.2,
  salesCount: 10,
  tags: ["AI", "Marketing"],
  licenseType: "Standard",
  isOwned: false,
  preview: "A useful prompt.",
  ...overrides,
});

describe("ComparisonTableView", () => {
  it("renders the prompt comparison table when three prompts are selected", () => {
    const selected = [
      makePrompt({ id: "1", title: "First Prompt" }),
      makePrompt({ id: "2", title: "Second Prompt" }),
      makePrompt({ id: "3", title: "Third Prompt" }),
    ];

    render(<ComparisonTableView selected={selected} onRemove={() => undefined} onClear={() => undefined} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /compare prompts/i })).toBeInTheDocument();
    expect(screen.getByText("First Prompt")).toBeInTheDocument();
    expect(screen.getByText("Second Prompt")).toBeInTheDocument();
    expect(screen.getByText("Third Prompt")).toBeInTheDocument();
  });

  it("renders the comparison header counter", () => {
    const selected = [makePrompt({ id: "a" }), makePrompt({ id: "b" }), makePrompt({ id: "c" })];

    render(<ComparisonTableView selected={selected} onRemove={() => undefined} onClear={() => undefined} />);

    expect(screen.getByText(/3\/4/i)).toBeInTheDocument();
  });

  it("renders column headers sortable by price, sales, and other fields", () => {
    const selected = [makePrompt({ id: "1" }), makePrompt({ id: "2" }), makePrompt({ id: "3" })];

    render(<ComparisonTableView selected={selected} onRemove={() => undefined} onClear={() => undefined} />);

    expect(screen.getByRole("columnheader", { name: /price/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /sales/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /rating/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /category/i })).toBeInTheDocument();
  });

  it("shows owned status badge for owned prompts", () => {
    const selected = [
      makePrompt({ id: "1", isOwned: false, title: "Prompt A" }),
      makePrompt({ id: "2", isOwned: true, title: "Prompt B" }),
      makePrompt({ id: "3", isOwned: false, title: "Prompt C" }),
    ];

    render(<ComparisonTableView selected={selected} onRemove={() => undefined} onClear={() => undefined} />);

    expect(screen.getByText("Owned")).toBeInTheDocument();
    expect(screen.getAllByText("Not purchased")).toHaveLength(2);
  });

  it("renders creator letter avatars and creator names", () => {
    const alice = makePrompt({ id: "1", creatorName: "Alice", title: "Prompt A" });
    const bob = makePrompt({ id: "2", creator: "GCreatorAddress1234567890", title: "Prompt B" });
    const carol = makePrompt({ id: "3", creator: "GCreatorAddress1234567891", title: "Prompt C" });

    render(
      <ComparisonTableView selected={[alice, bob, carol]} onRemove={() => undefined} onClear={() => undefined} />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getAllByTestId("letter-avatar")).toHaveLength(3);
  });

  it("renders LetterAvatar with an accessible fallback for creator initials", () => {
    const { getByTestId } = render(<LetterAvatar name="GCreator Address 1234567890" />);
    expect(getByTestId("letter-avatar")).toBeInTheDocument();
    expect(getByTestId("letter-avatar")).toHaveTextContent(/GCA/);
  });

  it("renders LetterAvatar with a fallback that stays within the max length", () => {
    const { getByTestId } = render(<LetterAvatar name="A B C" />);
    expect(getByTestId("letter-avatar")).toBeInTheDocument();
    expect(getByTestId("letter-avatar")).toHaveTextContent(/AB/);
  });

  it("renders LetterAvatar with a fallback shorter than the max length", () => {
    const { getByTestId } = render(<LetterAvatar name="AB" />);
    expect(getByTestId("letter-avatar")).toBeInTheDocument();
    expect(getByTestId("letter-avatar")).toHaveTextContent(/AB/);
  });

  it("calls onRemove when the remove button for a prompt is activated", () => {
    const remove = vi.fn();
    const selected1 = makePrompt({ id: "1" });
    const selected2 = makePrompt({ id: "2" });
    const selected3 = makePrompt({ id: "3" });

    render(
      <ComparisonTableView selected={[selected1, selected2, selected3]} onRemove={remove} onClear={() => undefined} />,
    );

    const removeButton = screen.getByTestId("remove-1");
    removeButton.click();
    expect(remove).toHaveBeenCalledWith("1");
  });

  it("calls onClear when the clear all button is activated", () => {
    const clear = vi.fn();
    const selected = [makePrompt({ id: "1" }), makePrompt({ id: "2" }), makePrompt({ id: "3" })];

    render(<ComparisonTableView selected={selected} onRemove={() => undefined} onClear={clear} />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    clearButton.click();
    expect(clear).toHaveBeenCalled();
  });

  it("renders missing-value placeholders when optional fields are absent", () => {
    const selected = [
      makePrompt({
        id: "1",
        price: undefined as unknown as number,
        category: "",
        rating: undefined as unknown as number,
        salesCount: undefined as unknown as number,
        tags: undefined,
        licenseType: "",
      }),
      makePrompt({ id: "2" }),
      makePrompt({ id: "3" }),
    ];

    render(<ComparisonTableView selected={selected} onRemove={() => undefined} onClear={() => undefined} />);

    expect(screen.getAllByText("—")).toHaveLength(4);
  });

  it("renders an empty state when no prompts are selected", () => {
    render(<ComparisonTableView selected={[]} onRemove={() => undefined} onClear={() => undefined} />);

    expect(screen.getByText(/select up to 4 prompts to compare them in a table view/i)).toBeInTheDocument();
  });

  it("renders a table-mode badge when at least three prompts are selected", () => {
    const selected = [makePrompt({ id: "1" }), makePrompt({ id: "2" }), makePrompt({ id: "3" })];

    render(<ComparisonTableView selected={selected} onRemove={() => undefined} onClear={() => undefined} />);

    expect(screen.getByText("Table view")).toBeInTheDocument();
  });
});
