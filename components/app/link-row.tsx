"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Pencil, Plus, Unlink2, X } from "lucide-react";
import type { LinkItem, LinkedProduct } from "@/lib/types";
import { cn, formatDate, formatPrice, formatSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onSave,
}: {
  link: LinkItem;
  expanded: boolean;
  onToggle: () => void;
  /** Unlink was clicked once; the next click within the window executes. */
  confirming: boolean;
  busy: boolean;
  onUnlink: () => void;
  /** Replace the listing's EAN set (backend POST /links replace semantics). */
  onSave: (eans: string[]) => Promise<void>;
}) {
  // The barcode sync writes links in bulk; be defensive about shapes the
  // curated flow never produces (null products array, missing item).
  const products = Array.isArray(link.products) ? link.products : [];
  const subtitle = [link.item?.brand, link.item?.sizeText]
    .filter(Boolean)
    .join(" · ");
  const shown = expanded ? products : products.slice(0, PRODUCT_PREVIEW);
  const hidden = products.length - shown.length;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [eanInput, setEanInput] = useState("");
  const [saving, setSaving] = useState(false);
  const eanValid = /^[0-9]{8,14}$/.test(eanInput);
  const byEan = new Map(products.map((p) => [p.ean, p]));

  const startEdit = () => {
    setDraft(products.map((p) => p.ean));
    setEanInput("");
    setEditing(true);
  };
  const addEan = () => {
    if (!eanValid || draft.includes(eanInput)) return;
    setDraft((d) => [...d, eanInput]);
    setEanInput("");
  };
  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

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
            variant="ghost"
            size="sm"
            disabled={busy || saving}
            onClick={() => (editing ? setEditing(false) : startEdit())}
            aria-label={editing ? "Cancel edit" : "Edit links"}
          >
            <Pencil />
            {editing ? "Cancel" : "Edit"}
          </Button>
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
        {editing ? (
          <div className="fade-in flex flex-col gap-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {draft.map((ean) => {
                const known = byEan.get(ean);
                return (
                  <div key={ean} className="relative">
                    {known ? (
                      <LinkedProductRow product={known} />
                    ) : (
                      <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-dashed border-primary/50 bg-muted/30 p-2">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Plus className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">New link</p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {ean}
                          </p>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${ean}`}
                      onClick={() =>
                        setDraft((d) => d.filter((e) => e !== ean))
                      }
                      className="absolute -right-1.5 -top-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-colors hover:bg-destructive hover:text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={eanInput}
                onChange={(e) =>
                  setEanInput(e.target.value.replace(/[^0-9]/g, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") addEan();
                }}
                placeholder="Add EAN (8–14 digits)…"
                inputMode="numeric"
                className="max-w-56"
                aria-label="Add EAN"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!eanValid || draft.includes(eanInput)}
                onClick={addEan}
              >
                <Plus /> Add
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                disabled={saving || draft.length === 0}
                onClick={save}
              >
                {saving ? <Loader2 className="animate-spin" /> : null}
                Save links ({draft.length})
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Saving replaces this listing&apos;s entire EAN set. Removed
              products lose their {link.storeType} price at the next sync
              sweep; new EANs are priced immediately.
            </p>
          </div>
        ) : products.length === 0 ? (
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
