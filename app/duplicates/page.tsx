"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { DuplicatePair, DuplicateSide } from "@/lib/types";
import { cn, formatSize, sizeDiffers, textDiffers } from "@/lib/utils";
import { useAuthGuard } from "@/lib/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorBanner } from "@/components/app/error-banner";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { ProductThumb } from "@/components/app/product-thumb";
import { CardListSkeleton } from "@/components/app/skeletons";
import { useStats } from "@/components/app/stats-provider";
import { useToast } from "@/components/app/toaster";

interface PairDiffs {
  name: boolean;
  brand: boolean;
  size: boolean;
  nameSource: boolean;
}

function diffPair(a: DuplicateSide, b: DuplicateSide): PairDiffs {
  return {
    name: textDiffers(a.name, b.name),
    brand: textDiffers(a.brand, b.brand),
    size: sizeDiffers(a.quantity, a.unitText, b.quantity, b.unitText),
    nameSource: textDiffers(a.nameSource, b.nameSource),
  };
}

export default function DuplicatesPage() {
  const ready = useAuthGuard();
  const toast = useToast();
  const { refreshStats } = useStats();

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (ready) void refreshStats();
  }, [ready, refreshStats]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .duplicates(page)
      .then((res) => setItems(Array.isArray(res.items) ? res.items : []))
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : "Failed to load duplicates"),
      )
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const approve = async (pair: DuplicatePair, keep: "a" | "b") => {
    const keepEan = keep === "a" ? pair.a.ean : pair.b.ean;
    setBusyId(String(pair.id));
    try {
      const res = await api.approveDuplicate(pair.id, keepEan);
      toast(`Kept ${res.keepEan}, linked ${res.linkedEan}`, "success");
      load();
      void refreshStats();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Approve failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const dismiss = async (pair: DuplicatePair) => {
    setBusyId(String(pair.id));
    try {
      await api.dismissDuplicate(pair.id);
      toast("Dismissed", "info");
      load();
      void refreshStats();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Dismiss failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Duplicates"
        subtitle="Pick which product survives — the other is linked into it"
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading && items.length === 0 && !error ? (
        <CardListSkeleton />
      ) : items.length === 0 && !error ? (
        <EmptyState
          title="No pending duplicates"
          hint="Duplicate suggestions are materialized after each sync and rematch."
          icon={<Copy />}
        />
      ) : (
        <>
          <Pagination
            page={page}
            hasNext={items.length > 0}
            disabled={loading}
            onPageChange={setPage}
          />
          <div
            className={cn(
              "flex flex-col gap-3",
              loading && "pointer-events-none opacity-60",
            )}
          >
            {items.map((pair) => {
              const busy = busyId === String(pair.id);
              const diffs = diffPair(pair.a, pair.b);
              return (
                <div
                  key={String(pair.id)}
                  className="card-in flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <Badge className="self-start border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    {pair.reason}
                  </Badge>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DupPanel
                      label="A"
                      side={pair.a}
                      diffs={diffs}
                      busy={busy}
                      onKeep={() => approve(pair, "a")}
                    />
                    <DupPanel
                      label="B"
                      side={pair.b}
                      diffs={diffs}
                      busy={busy}
                      onKeep={() => approve(pair, "b")}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => dismiss(pair)}
                    >
                      <X /> Dismiss — not duplicates
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  differs,
}: {
  label: string;
  value: string | null;
  differs: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <dt className="w-14 shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate",
          differs
            ? "rounded bg-amber-500/15 px-1 font-medium text-amber-700 dark:text-amber-300"
            : "text-foreground",
        )}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function DupPanel({
  label,
  side,
  diffs,
  busy,
  onKeep,
}: {
  label: string;
  side: DuplicateSide;
  diffs: PairDiffs;
  busy: boolean;
  onKeep: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background/40 p-3">
      <div className="flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {label}
        </span>
        <ProductThumb src={side.imageUrl} alt={side.name} className="size-16" />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              diffs.name && "underline decoration-amber-500/70 decoration-dotted underline-offset-2",
            )}
          >
            {side.name}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {side.ean}
          </p>
        </div>
      </div>
      <dl className="flex flex-col gap-1">
        <Field label="brand" value={side.brand} differs={diffs.brand} />
        <Field
          label="size"
          value={formatSize(side.quantity, side.unitText)}
          differs={diffs.size}
        />
        <Field label="source" value={side.nameSource} differs={diffs.nameSource} />
      </dl>
      <Button variant="primary" size="sm" disabled={busy} onClick={onKeep}>
        {busy ? <Loader2 className="animate-spin" /> : <Check />}
        Keep {label}
      </Button>
    </div>
  );
}
