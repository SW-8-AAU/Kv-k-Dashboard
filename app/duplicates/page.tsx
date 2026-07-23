"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { DuplicatePair, DuplicateSide } from "@/lib/types";
import { cn, formatSize } from "@/lib/utils";
import { useAuthGuard } from "@/lib/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/app/pagination";
import { ProductThumb } from "@/components/app/product-thumb";
import { useToast } from "@/components/app/toaster";

export default function DuplicatesPage() {
  const ready = useAuthGuard();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .duplicates(page)
      .then((res) => setItems(res.items))
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
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Dismiss failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Pending duplicates</h1>
      </div>

      <Pagination
        page={page}
        hasNext={items.length > 0}
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
          <Loader2 className="size-4 animate-spin" /> Loading duplicates…
        </p>
      ) : items.length === 0 && !error ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No pending duplicates.
        </p>
      ) : (
        <div className={cn("flex flex-col gap-3", loading && "opacity-60")}>
          {items.map((pair) => {
            const busy = busyId === String(pair.id);
            return (
              <div
                key={String(pair.id)}
                className="fade-in flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    {pair.reason}
                  </Badge>
                  <div className="flex gap-1.5">
                    <Button size="sm" disabled={busy} onClick={() => approve(pair, "a")}>
                      {busy ? <Loader2 className="animate-spin" /> : <Check />}
                      Keep A
                    </Button>
                    <Button size="sm" disabled={busy} onClick={() => approve(pair, "b")}>
                      {busy ? <Loader2 className="animate-spin" /> : <Check />}
                      Keep B
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => dismiss(pair)}>
                      <X /> Dismiss
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DupSide label="A" side={pair.a} />
                  <DupSide label="B" side={pair.b} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DupSide({ label, side }: { label: string; side: DuplicateSide }) {
  const subtitle = [side.brand, formatSize(side.quantity, side.unitText)]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {label}
      </span>
      <ProductThumb src={side.imageUrl} alt={side.name} className="size-14" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{side.name}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
        <p className="mt-1 font-mono text-xs">{side.ean}</p>
        <Badge className="mt-1 border-border bg-muted text-muted-foreground">
          {side.nameSource}
        </Badge>
      </div>
    </div>
  );
}
