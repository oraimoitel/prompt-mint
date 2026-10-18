import { X, ArrowUpDown, Shield, ShoppingBag, Tag, HelpCircle, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPriceLabel } from "@/lib/stellar/format";
import { MAX_COMPARE, encodeComparisonShare, isTableMode, COMPARISON_TABLE_COLUMNS, type ComparisonPrompt } from "@/lib/comparison/state";
import { useMemo, useState } from "react";
export type { ComparisonPrompt };
export { isTableMode, COMPARISON_TABLE_COLUMNS } from "@/lib/comparison/state";


export function LetterAvatar({ name }: { name: string }) {
  const colors = [
    "bg-emerald-600",
    "bg-cyan-600",
    "bg-violet-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-sky-600",
  ];

  const fallback = useMemo(() => {
    const cleaned = (name ?? "")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.slice(0, 2).toUpperCase())
      .filter(Boolean)
      .join("");
    return cleaned.length > 0 ? cleaned : "?";
  }, [name]);

  const colorIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < fallback.length; i++) {
      hash = fallback.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % colors.length;
  }, [fallback]);

  return (
    <Avatar className="h-9 w-9 border border-white/10" data-letter-avatar="" data-testid="letter-avatar">
      <AvatarImage />
      <AvatarFallback className={`flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-white ${colors[colorIndex]}`}>
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

function SortButton({
  label,
  column,
  current,
  direction,
  onSort,
}: {
  label: string;
  column: string;
  current: string;
  direction: "asc" | "desc";
  onSort: (column: string) => void;
}) {
  const active = current === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`flex h-9 w-9 items-center justify-center rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
        active
          ? direction === "asc"
            ? "text-emerald-300 bg-emerald-500/10"
            : "text-rose-300 bg-rose-500/10"
          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      }`}
      aria-sort={
        active
          ? direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      title={active ? `Sorting by ${label} (${direction === "asc" ? "ascending" : "descending"})` : `Sort by ${label}`}
    >
      {active ? (
        direction === "asc" ? (
          <ArrowUpDown className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-rose-300 rotate-180" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
      )}
    </button>
  );
}

function MissingValue({ reason }: { reason: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-500 text-xs" title={reason}>
      <HelpCircle className="h-3 w-3" aria-hidden="true" />
      <span>—</span>
    </span>
  );
}

function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-white whitespace-nowrap ${className ?? ""}`}>{children}</td>;
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400 border-b border-white/10">{children}</th>;
}

interface ComparisonTableViewProps {
  selected: ComparisonPrompt[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function ComparisonTableView({ selected, onRemove, onClear }: ComparisonTableViewProps) {
  const [sortColumn, setSortColumn] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [copyFeedback, setCopyFeedback] = useState(false);

  const sorted = useMemo(() => {
    return [...selected].sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      switch (sortColumn) {
        case "title":
          aValue = a.title;
          bValue = b.title;
          break;
        case "creator":
          aValue = a.creatorName ?? a.creator;
          bValue = b.creatorName ?? b.creator;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "category":
          aValue = a.category;
          bValue = b.category;
          break;
        case "rating":
          aValue = a.rating;
          bValue = b.rating;
          break;
        case "sales":
          aValue = a.salesCount;
          bValue = b.salesCount;
          break;
        case "tags":
          aValue = a.tags?.length ?? 0;
          bValue = b.tags?.length ?? 0;
          break;
        case "license":
          aValue = a.licenseType ?? "Standard";
          bValue = b.licenseType ?? "Standard";
          break;
        case "status":
          aValue = a.isOwned ? "owned" : "not-purchased";
          bValue = b.isOwned ? "owned" : "not-purchased";
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }

      const aFinal = aValue ?? "";
      const bFinal = bValue ?? "";

      if (aFinal === bFinal) return 0;
      if (typeof aFinal === "number" && typeof bFinal === "number") {
        return sortDirection === "asc" ? aFinal - bFinal : bFinal - aFinal;
      }

      return sortDirection === "asc"
        ? String(aFinal).localeCompare(String(bFinal))
        : String(bFinal).localeCompare(String(aFinal));
    });
  }, [selected, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection(column === "price" || column === "sales" || column === "tags" ? "desc" : "asc");
    }
  };

  const shareUrl = useMemo(() => {
    const encoded = encodeComparisonShare(selected.map((p) => p.id));
    if (!encoded) return "";
    return `${window.location.origin}/compare${encoded}`;
  }, [selected]);

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Clipboard unavailable — share feature degrades gracefully
    }
  };

  const shareButtonLabel = copyFeedback ? (
    <>
      <Check className="mr-1.5 h-3.5 w-3.5" />
      Copied
    </>
  ) : (
    <>
      <Copy className="mr-1.5 h-3.5 w-3.5" />
      Share
    </>
  );

  if (selected.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 p-10 text-center">
        <p className="text-slate-400 text-sm">
          Select up to {MAX_COMPARE} prompts to compare them in a table view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">
            Compare Prompts{" "}
            <span className="text-sm font-normal text-slate-400">
              ({selected.length}/{MAX_COMPARE})
            </span>
          </h2>
          {isTableMode(selected) ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-300">
              Table view
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {shareUrl ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyShareLink}
              className="border-white/10 text-slate-300 hover:text-white"
              aria-label="Copy shareable comparison link"
            >
              {shareButtonLabel}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={onClear} className="text-slate-400 hover:text-white">
            Clear all
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="w-full border-collapse" role="table" aria-label="Prompt comparison table">
          <thead className="bg-white/[0.02] sticky top-0 z-10">
            <tr>
              <TableHeader>Prompt</TableHeader>
              <TableHeader>Creator</TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <span>Price</span>
                  <SortButton label="Price" column="price" current={sortColumn} direction={sortDirection} onSort={handleSort} />
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <span>Category</span>
                  <SortButton label="Category" column="category" current={sortColumn} direction={sortDirection} onSort={handleSort} />
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <span>Rating</span>
                  <SortButton label="Rating" column="rating" current={sortColumn} direction={sortDirection} onSort={handleSort} />
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <span>Sales</span>
                  <SortButton label="Sales" column="sales" current={sortColumn} direction={sortDirection} onSort={handleSort} />
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <span>Tags</span>
                  <SortButton label="Tags" column="tags" current={sortColumn} direction={sortDirection} onSort={handleSort} />
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <span>License</span>
                  <SortButton label="License" column="license" current={sortColumn} direction={sortDirection} onSort={handleSort} />
                </div>
              </TableHeader>
              <TableHeader>
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <SortButton label="Status" column="status" current={sortColumn} direction={sortDirection} onSort={handleSort} />
                </div>
              </TableHeader>
              <TableHeader className="w-10"></TableHeader>
            </tr>
          </thead>
          <tbody>
            {sorted.map((prompt) => (
              <tr
                key={prompt.id}
                className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-white" title={prompt.title}>
                        {prompt.title}
                      </div>
                      <div className="truncate text-xs text-slate-500" title={prompt.id}>
                        #{prompt.id}
                      </div>
                    </div>                      <button
                      onClick={() => onRemove(prompt.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRemove(prompt.id);
                        }
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white transition-colors"
                      aria-label={`Remove ${prompt.title} from comparison`}
                      data-testid={`remove-${prompt.id}`}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <LetterAvatar name={prompt.creatorName ?? prompt.creator} />
                    <span className="truncate text-slate-300" title={prompt.creatorName ?? prompt.creator}>
                      {prompt.creatorName ?? prompt.creator}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {prompt.price !== undefined ? (
                    <span className="font-semibold text-cyan-300">
                      {formatPriceLabel(prompt.price)} {prompt.priceUnit ?? "XLM"}
                    </span>
                  ) : (
                    <MissingValue reason="Price is not publicly listed for this prompt." />
                  )}
                </TableCell>
                <TableCell>
                  {prompt.category ? (
                    <Badge variant="secondary" className="text-xs">{prompt.category}</Badge>
                  ) : (
                    <MissingValue reason="Creator did not assign a category." />
                  )}
                </TableCell>
                <TableCell>
                  {prompt.rating !== undefined ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-amber-400">{prompt.rating.toFixed(1)}</span>
                      <span className="text-xs text-slate-500">/ 5</span>
                    </div>
                  ) : (
                    <MissingValue reason="No ratings have been submitted for this prompt yet." />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span className="font-medium tabular-nums">{prompt.salesCount ?? 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {prompt.tags && prompt.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
                          <Tag className="h-3 w-3" aria-hidden="true" />
                          {tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="text-xs text-slate-500">+{prompt.tags.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <MissingValue reason="Creator did not add tags to this listing." />
                  )}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <Shield className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {prompt.licenseType ?? "Standard"}
                  </span>
                </TableCell>
                <TableCell>
                  {prompt.isOwned ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                      <Shield className="h-3 w-3" aria-hidden="true" />
                      Owned
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Not purchased</span>
                  )}
                </TableCell>
                <TableCell className="w-10"></TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Table view activates automatically when you select 3 or more prompts. Use the column headers to sort by price, sales, or any other field.
      </p>
    </div>
  );
}
