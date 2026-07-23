"use client";

import { ChevronDown, Loader2, Unlink2 } from "lucide-react";
import type { LinkItem, LinkedProduct } from "@/lib/types";
import { cn, formatDate, formatPrice, formatSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LinkSourceBadge, StoreBadge } from "./badges";
import { ProductThumb } from "./product-thumb";

const PRODUCT_PREVIEW = 3;

/** The catalogue product a listing points at — image + identity, so the
 *  curator can visually verify the link without leaving the page. */
function LinkedProductRow({ product }: { product: LinkedProduct }) {
  const size = formatSize(product.quantity, product.unitText);
  const subtitle = [product.brand, size].filter(Boolean).join(" · ");
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border/70 bg-muted/30 p-2">
      <ProductThumb
        src={product.imageUrl}
        alt={product.name ?? product.ean}
        className="size-12"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name ?? "—"}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
        <p className="font-mono text-[11px] text-muted-foreground">
          {product.ean}
        </p>
      </div>
    </div>
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
  const shown = expanded ? products : products.slice(0, PRODUCT_PREVIEW);
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

      <div className="px-4 pb-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Linked to
        </p>
        {products.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            No linked products.
          </span>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, i) => (
              <LinkedProductRow key={`${p.ean}-${i}`} product={p} />
            ))}
            {hidden > 0 && (
              <button
                type="button"
                onClick={onToggle}
                className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
              >
                +{hidden} more
              </button>
            )}
          </div>
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
