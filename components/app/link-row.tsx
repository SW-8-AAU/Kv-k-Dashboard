"use client";

import { ChevronDown, Loader2, Unlink2 } from "lucide-react";
import type { LinkItem, LinkedProduct } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LinkSourceBadge, StoreBadge } from "./badges";
import { ProductThumb } from "./product-thumb";

const CHIP_PREVIEW = 6;

function EanChip({ product }: { product: LinkedProduct }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs">
      <span className="font-mono">{product.ean}</span>
      <span className="max-w-52 truncate text-muted-foreground">
        {product.name ?? "—"}
      </span>
    </span>
  );
}

/** One matched listing: compact row, expandable detail, two-step unlink. */
export function LinkRow({
  link,
  expanded,
  onToggle,
  confirming,
  busy,
  onUnlink,
}: {
  link: LinkItem;
  expanded: boolean;
  onToggle: () => void;
  /** Unlink was clicked once; the next click within the window executes. */
  confirming: boolean;
  busy: boolean;
  onUnlink: () => void;
}) {
  // The barcode sync writes links in bulk; be defensive about shapes the
  // curated flow never produces (null products array, missing item).
  const products = Array.isArray(link.products) ? link.products : [];
  const subtitle = [link.item?.brand, link.item?.sizeText]
    .filter(Boolean)
    .join(" · ");
  const shown = expanded ? products : products.slice(0, CHIP_PREVIEW);
  const hidden = products.length - shown.length;

  return (
    <div className="card-in rounded-xl border border-border bg-card shadow-card transition-shadow duration-150 hover:shadow-raised">
      <div className="flex items-start gap-3 p-4">
        <ProductThumb
          src={link.item?.imageUrl}
          alt={link.item?.name ?? link.storeProductId}
          className="size-14"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {link.item?.name ?? `(${link.storeProductId})`}
          </p>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatPrice(link.item?.price) ?? "no price"} · linked{" "}
            {link.linkedAt ? formatDate(link.linkedAt) : "—"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <StoreBadge storeType={link.storeType} />
          <LinkSourceBadge linkSource={link.linkSource} />
          <Button
            variant={confirming ? "destructive" : "ghost"}
            size="sm"
            disabled={busy}
            onClick={onUnlink}
            aria-label={confirming ? "Confirm unlink" : "Unlink"}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Unlink2 />}
            {confirming ? "Confirm?" : "Unlink"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            onClick={onToggle}
          >
            <ChevronDown
              className={cn(
                "transition-transform duration-150",
                expanded && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        {products.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            No linked products.
          </span>
        ) : (
          <>
            {shown.map((p, i) => (
              <EanChip key={`${p.ean}-${i}`} product={p} />
            ))}
            {hidden > 0 && (
              <button
                type="button"
                onClick={onToggle}
                className="cursor-pointer rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
              >
                +{hidden} more
              </button>
            )}
          </>
        )}
      </div>

      {expanded && (
        <div className="fade-in border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">Listing id</dt>
              <dd className="font-mono">{link.storeProductId}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">Source</dt>
              <dd>{link.linkSource}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">Linked</dt>
              <dd>{link.linkedAt ? formatDate(link.linkedAt) : "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">Products</dt>
              <dd>{products.length}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
