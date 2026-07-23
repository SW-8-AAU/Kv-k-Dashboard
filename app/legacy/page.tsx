"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { QueueItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/lib/use-auth";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/app/pagination";
import { QueueCard } from "@/components/app/queue-card";

const LIMIT = 50;

export default function LegacyPage() {
  const ready = useAuthGuard();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .queue({
        legacy: 1,
        storeType: "rema",
        query: debounced || undefined,
        page,
        limit: LIMIT,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : "Failed to load legacy items"),
      )
      .finally(() => setLoading(false));
  }, [debounced, page]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const removeItem = (it: QueueItem) => {
    setItems((prev) =>
      prev.filter(
        (x) => !(x.storeType === it.storeType && x.storeProductId === it.storeProductId),
      ),
    );
    setTotal((t) => Math.max(0, t - 1));
  };

  if (!ready) return null;

  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold">Legacy Rema items</h1>
          <p className="text-sm text-muted-foreground">
            Each item is backed by a synthetic product. Pick exactly one EAN — the
            result is either a rename of the synthetic product or a merge into an
            existing one.
          </p>
        </div>
        <div className="relative ml-auto min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search legacy items…"
            className="pl-8"
            aria-label="Search"
          />
        </div>
      </div>

      <Pagination page={page} pageCount={pageCount} total={total} disabled={loading} onPageChange={setPage} />

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading legacy items…
        </p>
      ) : items.length === 0 && !error ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No legacy items left.
        </p>
      ) : (
        <div className={cn("flex flex-col gap-3", loading && "opacity-60")}>
          {items.map((item) => (
            <QueueCard
              key={`${item.storeType}-${item.storeProductId}`}
              item={item}
              mode="legacy"
              onRemove={() => removeItem(item)}
            />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <Pagination page={page} pageCount={pageCount} total={total} disabled={loading} onPageChange={setPage} />
      )}
    </div>
  );
}
