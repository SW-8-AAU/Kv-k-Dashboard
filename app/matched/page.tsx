"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Unlink2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { LinkItem, StoreType } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { useAuthGuard } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LinkSourceBadge, StoreBadge } from "@/components/app/badges";
import { Pagination } from "@/components/app/pagination";
import { ProductThumb } from "@/components/app/product-thumb";
import { useToast } from "@/components/app/toaster";

const STORES: StoreType[] = ["lidl", "rema", "salling"];

export default function MatchedPage() {
  const ready = useAuthGuard();
  const toast = useToast();

  const [storeType, setStoreType] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LinkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .links({ storeType: storeType || undefined, page })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        // The /links endpoint has no limit param; infer page size from page 1.
        if (page === 1) setPerPage(res.items.length > 0 ? res.items.length : null);
      })
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : "Failed to load links"),
      )
      .finally(() => setLoading(false));
  }, [storeType, page]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const unlink = async (link: LinkItem) => {
    const id = `${link.storeType}-${link.storeProductId}`;
    setBusyId(id);
    try {
      const res = await api.unlink({
        storeType: link.storeType,
        storeProductId: link.storeProductId,
      });
      toast(`Unlinked (${res.removed} removed)`, "success");
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Unlink failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) return null;

  const pageCount = perPage ? Math.max(1, Math.ceil(total / perPage)) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Matched listings</h1>
        <span className="text-sm text-muted-foreground">{total} total</span>
        <Select
          value={storeType}
          onChange={(e) => {
            setStoreType(e.target.value);
            setPage(1);
          }}
          className="ml-auto"
          aria-label="Store filter"
        >
          <option value="">All stores</option>
          {STORES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        hasNext={pageCount === undefined ? items.length > 0 : undefined}
        disabled={loading}
        onPageChange={setPage}
      />

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading links…
        </p>
      ) : items.length === 0 && !error ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No links yet.</p>
      ) : (
        <div className={cn("flex flex-col gap-3", loading && "opacity-60")}>
          {items.map((link) => {
            const id = `${link.storeType}-${link.storeProductId}`;
            const subtitle = [link.item?.brand, link.item?.sizeText]
              .filter(Boolean)
              .join(" · ");
            return (
              <div
                key={id}
                className="fade-in flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
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
                      {formatDate(link.linkedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex gap-1.5">
                      <StoreBadge storeType={link.storeType} />
                      <LinkSourceBadge linkSource={link.linkSource} />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => unlink(link)}
                    >
                      {busyId === id ? <Loader2 className="animate-spin" /> : <Unlink2 />}
                      Unlink
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {link.products.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No linked products.</span>
                  ) : (
                    link.products.map((p) => (
                      <span
                        key={p.ean}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs"
                      >
                        <span className="font-mono">{p.ean}</span>
                        <span className="max-w-52 truncate text-muted-foreground">
                          {p.name ?? "—"}
                        </span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          hasNext={pageCount === undefined ? items.length > 0 : undefined}
          disabled={loading}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
