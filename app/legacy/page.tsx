"use client";

import { useCallback, useEffect, useState } from "react";
import { History, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { QueueItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/lib/use-auth";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorBanner } from "@/components/app/error-banner";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { QueueCard } from "@/components/app/queue-card";
import { CardListSkeleton } from "@/components/app/skeletons";
import { useStats } from "@/components/app/stats-provider";

const LIMIT = 50;
const EXIT_MS = 190;

const keyOf = (it: QueueItem) => `${it.storeType}-${it.storeProductId}`;

export default function LegacyPage() {
  const ready = useAuthGuard();
  const { refreshStats } = useStats();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (ready) void refreshStats();
  }, [ready, refreshStats]);

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
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e: unknown) =>
        setError(
          e instanceof ApiError ? e.message : "Failed to load legacy items",
        ),
      )
      .finally(() => setLoading(false));
  }, [debounced, page]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const removeItem = (it: QueueItem) => {
    const id = keyOf(it);
    setLeaving((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => keyOf(x) !== id));
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setTotal((t) => Math.max(0, t - 1));
      void refreshStats();
    }, EXIT_MS);
  };

  if (!ready) return null;

  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Legacy"
        subtitle="Rema items backed by a synthetic rema-… product — pick one EAN to rename or merge"
      >
        <div className="relative w-48 sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search legacy items…"
            className="pl-8"
            aria-label="Search"
          />
        </div>
      </PageHeader>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading && items.length === 0 && !error ? (
        <CardListSkeleton />
      ) : items.length === 0 && !error ? (
        <EmptyState
          title={
            debounced ? `No results for “${debounced}”` : "No legacy items left"
          }
          hint={
            debounced
              ? "Try a shorter search term."
              : "Every synthetic rema-… product has been renamed or merged. New ones only appear if a sync finds barcode-less items."
          }
          icon={<History />}
        />
      ) : items.length === 0 ? null : (
        <>
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            disabled={loading}
            onPageChange={setPage}
          />
          <div
            className={cn(
              "flex flex-col gap-3",
              loading && "pointer-events-none opacity-60",
            )}
          >
            {items.map((item) => (
              <QueueCard
                key={keyOf(item)}
                item={item}
                mode="legacy"
                leaving={leaving.has(keyOf(item))}
                onRemove={() => removeItem(item)}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            disabled={loading}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
