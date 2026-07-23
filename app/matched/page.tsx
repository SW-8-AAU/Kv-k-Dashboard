"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { LinkItem, StoreType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/lib/use-auth";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorBanner } from "@/components/app/error-banner";
import { LinkRow } from "@/components/app/link-row";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { CardListSkeleton } from "@/components/app/skeletons";
import { useStats } from "@/components/app/stats-provider";
import { useToast } from "@/components/app/toaster";

const STORES: StoreType[] = [
  "lidl",
  "rema",
  "salling",
  "meny",
  "spar",
  "min-kobmand",
];
const PAGE_SIZE = 50;
/** Above this the server clearly didn't paginate; slice client-side instead
 *  of rendering thousands of rows (the barcode sync creates ~4k links). */
const CLIENT_PAGE_THRESHOLD = 60;

const rowKey = (l: LinkItem) => `${l.storeType}-${l.storeProductId}`;

export default function MatchedPage() {
  const ready = useAuthGuard();
  const toast = useToast();
  const { stats, refreshStats } = useStats();

  const [storeType, setStoreType] = useState("");
  const [curated, setCurated] = useState(true);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LinkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => {
    if (ready) void refreshStats();
  }, [ready, refreshStats]);

  const load = useCallback(
    (pageArg: number) => {
      setLoading(true);
      setError(null);
      api
        .links({
          storeType: storeType || undefined,
          page: pageArg,
          curated: curated ? 1 : undefined,
        })
        .then((res) => {
          const arr = Array.isArray(res.items) ? res.items : [];
          setItems(arr);
          setTotal(
            typeof res.total === "number" && Number.isFinite(res.total)
              ? res.total
              : arr.length,
          );
          if (pageArg === 1 && arr.length > 0) setPerPage(arr.length);
          setExpanded(new Set());
        })
        .catch((e: unknown) =>
          setError(e instanceof ApiError ? e.message : "Failed to load links"),
        )
        .finally(() => setLoading(false));
    },
    [storeType, curated],
  );

  // Filter changes restart from page 1.
  useEffect(() => {
    if (!ready) return;
    setPage(1);
    load(1);
  }, [ready, load]);

  const clientMode = items.length > CLIENT_PAGE_THRESHOLD;
  const visible = useMemo(
    () =>
      clientMode
        ? items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        : items,
    [clientMode, items, page],
  );

  const pageCount = clientMode
    ? Math.max(1, Math.ceil(items.length / PAGE_SIZE))
    : perPage && perPage > 0
      ? Math.max(1, Math.ceil(total / perPage))
      : undefined;

  const changePage = (p: number) => {
    const next = Math.max(1, p);
    setPage(next);
    if (!clientMode) load(next);
    window.scrollTo({ top: 0 });
  };

  const linkCounts = useMemo(() => {
    let curatedCount = 0;
    let allCount = 0;
    for (const row of stats?.links ?? []) {
      if (storeType && row.storeType !== storeType) continue;
      allCount += row.count;
      if (row.linkSource === "manual" || row.linkSource === "auto-approved") {
        curatedCount += row.count;
      }
    }
    return { curatedCount, allCount };
  }, [stats, storeType]);

  const unlink = async (link: LinkItem) => {
    const id = rowKey(link);
    if (confirmId !== id) {
      setConfirmId(id);
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
      confirmTimer.current = window.setTimeout(() => setConfirmId(null), 3000);
      return;
    }
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    setConfirmId(null);
    setBusyId(id);
    try {
      const res = await api.unlink({
        storeType: link.storeType,
        storeProductId: link.storeProductId,
      });
      toast(`Unlinked (${res.removed} removed)`, "success");
      load(clientMode ? 1 : page);
      if (clientMode) setPage(1);
      void refreshStats();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Unlink failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const saveLinks = async (link: LinkItem, eans: string[]) => {
    try {
      const res = await api.createLink({
        storeType: link.storeType,
        storeProductId: link.storeProductId,
        eans,
      });
      const priced = res.priced ? ` · priced at ${res.priced} stores` : "";
      toast(
        `Links updated (${eans.length} EAN${eans.length === 1 ? "" : "s"})${priced}`,
        "success",
      );
      load(clientMode ? 1 : page);
      void refreshStats();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update links", "error");
      throw e;
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!ready) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Matched" subtitle={`${total} link(s) in this view`}>
        <Select
          value={storeType}
          onChange={(e) => setStoreType(e.target.value)}
          aria-label="Store filter"
        >
          <option value="">All stores</option>
          {STORES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </PageHeader>

      <div
        role="tablist"
        aria-label="Link source"
        className="flex self-start rounded-lg border border-border bg-card p-0.5 shadow-card"
      >
        {[
          {
            value: true,
            label: "Curated",
            count: linkCounts.curatedCount,
            title: "manual + auto-approved links",
          },
          {
            value: false,
            label: "All links",
            count: linkCounts.allCount,
            title: "includes barcode (auto) links from the sync",
          },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={curated === tab.value}
            title={tab.title}
            onClick={() => setCurated(tab.value)}
            className={cn(
              "cursor-pointer rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
              curated === tab.value
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs tabular-nums opacity-70">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => load(page)} />}

      {loading && items.length === 0 && !error ? (
        <CardListSkeleton />
      ) : items.length === 0 && !error ? (
        <EmptyState
          title={curated ? "No curated links yet" : "No links yet"}
          hint={
            curated
              ? "Approve items in the Queue to create manual links, or switch to “All links” to see barcode (auto) links from the sync."
              : "Run a store sync from the Sync menu to create barcode links."
          }
          icon={<Link2 />}
        />
      ) : items.length === 0 ? null : (
        <>
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            hasNext={pageCount === undefined ? items.length > 0 : undefined}
            disabled={loading}
            onPageChange={changePage}
          />
          <div
            className={cn(
              "flex flex-col gap-3",
              loading && "pointer-events-none opacity-60",
            )}
          >
            {visible.map((link, idx) => {
              const id = rowKey(link);
              return (
                <LinkRow
                  key={`${id}-${idx}`}
                  link={link}
                  expanded={expanded.has(id)}
                  onToggle={() => toggleExpand(id)}
                  confirming={confirmId === id}
                  busy={busyId === id}
                  onUnlink={() => unlink(link)}
                  onSave={(eans) => saveLinks(link, eans)}
                />
              );
            })}
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            hasNext={pageCount === undefined ? items.length > 0 : undefined}
            disabled={loading}
            onPageChange={changePage}
          />
        </>
      )}
    </div>
  );
}
