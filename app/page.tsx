"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, EyeOff, Loader2, RefreshCw, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Bucket, QueueItem, StatsResponse, StoreType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/app/pagination";
import { QueueCard } from "@/components/app/queue-card";
import { StoreBadge } from "@/components/app/badges";
import { useToast } from "@/components/app/toaster";

const LIMIT = 50;
const STORES: StoreType[] = ["lidl", "rema", "salling"];
const BUCKETS: Bucket[] = ["match", "possible", "none"];

export default function QueuePage() {
  const ready = useAuthGuard();
  const toast = useToast();

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [storeType, setStoreType] = useState("");
  const [bucket, setBucket] = useState<Bucket>("match");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (ready) loadStats();
  }, [ready, loadStats]);

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
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        if (stale) return;
        setListError(e instanceof ApiError ? e.message : "Failed to load the queue");
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [ready, storeType, bucket, debounced, page]);

  const bucketCounts = useMemo(() => {
    const counts: Record<Bucket, number> = { match: 0, possible: 0, none: 0 };
    for (const row of stats?.queue ?? []) {
      if (storeType && row.storeType !== storeType) continue;
      if (row.bucket in counts) counts[row.bucket] += row.count;
    }
    return counts;
  }, [stats, storeType]);

  const storeCounts = useMemo(() => {
    const map = new Map<StoreType, Record<Bucket, number>>();
    for (const s of STORES) map.set(s, { match: 0, possible: 0, none: 0 });
    for (const row of stats?.queue ?? []) {
      const entry = map.get(row.storeType);
      if (entry && row.bucket in entry) entry[row.bucket] += row.count;
    }
    return map;
  }, [stats]);

  const removeItem = (it: QueueItem) => {
    setItems((prev) =>
      prev.filter(
        (x) => !(x.storeType === it.storeType && x.storeProductId === it.storeProductId),
      ),
    );
    setTotal((t) => Math.max(0, t - 1));
    loadStats();
  };

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setAction(label);
    try {
      await fn();
      toast(`202 started · ${label}`, "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : `${label} failed`, "error");
    } finally {
      setAction(null);
    }
  };

  if (!ready) return null;

  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {STORES.map((s) => {
          const n = storeCounts.get(s) ?? { match: 0, possible: 0, none: 0 };
          return (
            <div
              key={s}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs"
            >
              <StoreBadge storeType={s} />
              <span className="text-muted-foreground">
                match <b className="font-semibold text-foreground">{n.match}</b> ·
                possible <b className="font-semibold text-foreground">{n.possible}</b> ·
                none <b className="font-semibold text-foreground">{n.none}</b>
              </span>
            </div>
          );
        })}
        <Link
          href="/duplicates"
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
            (stats?.pendingDuplicates ?? 0) > 0
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
              : "border-border bg-card text-muted-foreground hover:bg-accent",
          )}
        >
          <Copy className="size-3.5" />
          Duplicates <b className="font-semibold">{stats?.pendingDuplicates ?? 0}</b>
        </Link>
        <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground">
          <EyeOff className="size-3.5" />
          Ignored <b className="font-semibold">{stats?.ignored ?? 0}</b>
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button size="sm" disabled={action !== null} onClick={() => runAction("rematch", api.rematch)}>
            {action === "rematch" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Rematch
          </Button>
          <Button size="sm" disabled={action !== null} onClick={() => runAction("sync lidl", () => api.sync("lidl"))}>
            {action === "sync lidl" && <Loader2 className="animate-spin" />}
            Sync Lidl
          </Button>
          <Button size="sm" disabled={action !== null} onClick={() => runAction("sync rema", () => api.sync("rema"))}>
            {action === "sync rema" && <Loader2 className="animate-spin" />}
            Sync Rema
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex rounded-lg border border-border bg-card p-0.5">
          {BUCKETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => {
                setBucket(b);
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                bucket === b
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {b}
              <span className="ml-1.5 text-xs opacity-70">{bucketCounts[b]}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the queue…"
            className="pl-8"
            aria-label="Search"
          />
        </div>
      </div>

      <Pagination page={page} pageCount={pageCount} total={total} disabled={loading} onPageChange={setPage} />

      {listError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {listError}
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading queue…
        </p>
      ) : items.length === 0 && !listError ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Queue is empty for this filter.
        </p>
      ) : (
        <div className={cn("flex flex-col gap-3", loading && "opacity-60")}>
          {items.map((item) => (
            <QueueCard
              key={`${item.storeType}-${item.storeProductId}`}
              item={item}
              mode="queue"
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
