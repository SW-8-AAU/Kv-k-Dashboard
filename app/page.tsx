"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Bucket, QueueItem, StoreType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/lib/use-auth";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorBanner } from "@/components/app/error-banner";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { QueueCard } from "@/components/app/queue-card";
import { CardListSkeleton } from "@/components/app/skeletons";
import { useStats } from "@/components/app/stats-provider";
import { useQueueKeyboard } from "@/components/app/use-queue-keyboard";

const LIMIT = 50;
const EXIT_MS = 190;
const STORES: StoreType[] = ["lidl", "rema", "salling"];
const BUCKETS: Bucket[] = ["match", "possible", "none"];

const EMPTY_HINTS: Record<Bucket, string> = {
  match:
    "No confident matches waiting. New suggestions appear after a store sync — run Rematch (Sync menu) after seeding OFF to regenerate.",
  possible:
    "No borderline suggestions to review. Check the Match bucket, or run Rematch to recompute.",
  none:
    "No unmatched items. Everything from the last sync either matched or was ignored.",
};

const keyOf = (it: QueueItem) => `${it.storeType}-${it.storeProductId}`;

export default function QueuePage() {
  const ready = useAuthGuard();
  const { stats, refreshStats } = useStats();

  const [storeType, setStoreType] = useState("");
  const [bucket, setBucket] = useState<Bucket>("match");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());

  const { selectedIdx, setSelectedIdx, registerFor, setCardEl } =
    useQueueKeyboard(items);

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

  useEffect(() => {
    if (!ready) return;
    let stale = false;
    setLoading(true);
    setListError(null);
    api
      .queue({
        storeType: storeType || undefined,
        bucket,
        query: debounced || undefined,
        page,
        limit: LIMIT,
      })
      .then((res) => {
        if (stale) return;
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
        setSelectedIdx(null);
      })
      .catch((e: unknown) => {
        if (stale) return;
        setListError(
          e instanceof ApiError ? e.message : "Failed to load the queue",
        );
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [ready, storeType, bucket, debounced, page, reloadKey, setSelectedIdx]);

  const removeItem = useCallback(
    (it: QueueItem) => {
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
    },
    [refreshStats],
  );

  const bucketCounts = useMemo(() => {
    const counts: Record<Bucket, number> = { match: 0, possible: 0, none: 0 };
    for (const row of stats?.queue ?? []) {
      if (storeType && row.storeType !== storeType) continue;
      if (row.bucket in counts) counts[row.bucket] += row.count;
    }
    return counts;
  }, [stats, storeType]);

  if (!ready) return null;

  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Queue"
        subtitle={`${total} item(s) in this view · ${stats?.ignored ?? 0} ignored`}
      >
        <Select
          value={storeType}
          onChange={(e) => {
            setStoreType(e.target.value);
            setPage(1);
          }}
          aria-label="Store filter"
        >
          <option value="">All stores</option>
          {STORES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <div className="relative w-48 sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the queue…"
            className="pl-8"
            aria-label="Search"
          />
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Bucket"
          className="flex rounded-lg border border-border bg-card p-0.5 shadow-card"
        >
          {BUCKETS.map((b) => (
            <button
              key={b}
              type="button"
              role="tab"
              aria-selected={bucket === b}
              onClick={() => {
                setBucket(b);
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition-colors duration-150",
                bucket === b
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {b}
              <span className="ml-1.5 text-xs tabular-nums opacity-70">
                {bucketCounts[b]}
              </span>
            </button>
          ))}
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">
          <kbd className="rounded border border-border bg-muted px-1 font-mono">j</kbd>/
          <kbd className="rounded border border-border bg-muted px-1 font-mono">k</kbd>{" "}
          navigate ·{" "}
          <kbd className="rounded border border-border bg-muted px-1 font-mono">A</kbd>{" "}
          approve ·{" "}
          <kbd className="rounded border border-border bg-muted px-1 font-mono">I</kbd>{" "}
          ignore ·{" "}
          <kbd className="rounded border border-border bg-muted px-1 font-mono">Esc</kbd>{" "}
          deselect
        </p>
      </div>

      {listError && (
        <ErrorBanner
          message={listError}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      )}

      {loading && items.length === 0 && !listError ? (
        <CardListSkeleton />
      ) : items.length === 0 && !listError ? (
        <EmptyState
          title={
            debounced ? `No results for “${debounced}”` : `Nothing in ${bucket}`
          }
          hint={debounced ? "Try a shorter search term." : EMPTY_HINTS[bucket]}
          icon={<Inbox />}
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
            {items.map((item, idx) => {
              const id = keyOf(item);
              return (
                <div key={id} ref={setCardEl(id)} onClick={() => setSelectedIdx(idx)}>
                  <QueueCard
                    item={item}
                    mode="queue"
                    selected={selectedIdx === idx}
                    leaving={leaving.has(id)}
                    registerActions={registerFor(id)}
                    onRemove={() => removeItem(item)}
                  />
                </div>
              );
            })}
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
