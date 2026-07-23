"use client";

import type { Candidate, QueueItem } from "@/lib/types";
import { cn, formatSize, sizeDiffers, textDiffers } from "@/lib/utils";
import { SourceBadge } from "./badges";
import { ProductThumb } from "./product-thumb";

/** One candidate as a comparison row: candidate values on top, the retailer
 *  item's values inline underneath whenever a field differs (amber = differs). */
export function CandidateRow({
  candidate: c,
  item,
  type,
  name,
  checked,
  onSelect,
}: {
  candidate: Candidate;
  item: QueueItem;
  type: "checkbox" | "radio";
  name: string;
  checked: boolean;
  onSelect: () => void;
}) {
  const size = formatSize(c.quantity, c.unitText);
  const itemSize = item.sizeText ?? formatSize(item.quantity, item.unitText);
  const brandDiff = textDiffers(c.brand, item.brand);
  const sizeDiff = sizeDiffers(c.quantity, c.unitText, item.quantity, item.unitText);
  const diffs: string[] = [];
  if (brandDiff && item.brand) diffs.push(item.brand);
  if (sizeDiff && itemSize) diffs.push(itemSize);

  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition-colors duration-150",
          checked
            ? "border-primary/50 bg-primary/5"
            : "border-border/70 hover:bg-accent/50",
        )}
      >
        <input
          type={type}
          name={type === "radio" ? name : undefined}
          checked={checked}
          onChange={onSelect}
          className="mt-2.5 size-4 shrink-0 accent-primary"
          aria-label={`Select ${c.name ?? c.ean}`}
        />
        <ProductThumb src={c.imageUrl} alt={c.name ?? c.ean} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{c.name ?? "—"}</p>
          <p className="truncate text-xs">
            <span
              className={cn(
                brandDiff
                  ? "font-medium text-amber-700 dark:text-amber-300"
                  : "text-muted-foreground",
              )}
            >
              {c.brand ?? "no brand"}
            </span>
            <span className="text-muted-foreground"> · </span>
            <span
              className={cn(
                sizeDiff
                  ? "font-medium text-amber-700 dark:text-amber-300"
                  : "text-muted-foreground",
              )}
            >
              {size ?? "no size"}
            </span>
          </p>
          {diffs.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              retailer item: {diffs.join(" · ")}
            </p>
          )}
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {c.reason} · score {c.score.toFixed(2)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-xs">{c.ean}</span>
          <SourceBadge source={c.source} />
        </div>
      </label>
    </li>
  );
}
