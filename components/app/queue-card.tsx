"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, Check, ExternalLink, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { LinkResult, QueueItem } from "@/lib/types";
import { cn, EAN_PATTERN, formatPrice, formatSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GateBadge, StoreBadge } from "./badges";
import { CandidateRow } from "./candidate-row";
import { ProductThumb } from "./product-thumb";
import { useToast } from "./toaster";

const CUSTOM = "__custom__";

export interface QueueCardActions {
  approve: () => void;
  ignore: () => void;
}

interface CardError {
  message: string;
  missing: string[];
}

function approveToast(result: LinkResult, requested: number): string {
  if (result.status === "renamed") {
    return `Renamed synthetic product${result.ean ? ` → ${result.ean}` : ""} (no existing product matched)`;
  }
  if (result.status === "merged") {
    return `Merged into existing product${result.ean ? ` ${result.ean}` : ""} — offers and history moved`;
  }
  const linked = result.linked?.length ?? requested;
  const created = result.created?.length ? `, created ${result.created.length}` : "";
  const priced =
    typeof result.priced === "number"
      ? ` · priced at ${result.priced} store${result.priced === 1 ? "" : "s"}`
      : "";
  const mirrored = result.mirrored?.length
    ? ` · also linked at ${result.mirrored.join(", ")}`
    : "";
  return `Linked ${linked} EAN(s)${created}${priced}${mirrored}`;
}

export function QueueCard({
  item,
  mode,
  onRemove,
  selected = false,
  leaving = false,
  registerActions,
}: {
  item: QueueItem;
  /** "queue": multi-select checkboxes + custom EAN. "legacy": exactly one EAN via radios. */
  mode: "queue" | "legacy";
  onRemove: () => void;
  /** Keyboard-navigation highlight. */
  selected?: boolean;
  /** Plays the exit animation while the parent delays actual removal. */
  leaving?: boolean;
  /** Lets the parent trigger approve/ignore for the keyboard flow. */
  registerActions?: (actions: QueueCardActions | null) => void;
}) {
  const toast = useToast();
  const [checked, setChecked] = useState<string[]>(() =>
    mode === "queue" && item.bucket === "match"
      ? item.candidates.map((c) => c.ean)
      : [],
  );
  const [selectedEan, setSelectedEan] = useState<string>("");
  const [customEan, setCustomEan] = useState("");
  const [error, setError] = useState<CardError | null>(null);
  const [busy, setBusy] = useState<"approve" | "ignore" | null>(null);

  const customValid = EAN_PATTERN.test(customEan);
  const radioName = `sel-${item.storeType}-${item.storeProductId}`;

  const eans =
    mode === "queue"
      ? customEan
        ? customValid
          ? [...checked, customEan]
          : []
        : checked
      : selectedEan === CUSTOM
        ? customValid
          ? [customEan]
          : []
        : selectedEan
          ? [selectedEan]
          : [];

  const toggle = (ean: string) =>
    setChecked((prev) =>
      prev.includes(ean) ? prev.filter((e) => e !== ean) : [...prev, ean],
    );

  const approve = async () => {
    if (eans.length === 0 || busy) return;
    setBusy("approve");
    setError(null);
    try {
      const result = await api.createLink({
        storeType: item.storeType,
        storeProductId: item.storeProductId,
        eans,
      });
      toast(approveToast(result, eans.length), "success");
      onRemove();
    } catch (e) {
      if (e instanceof ApiError) {
        setError({ message: e.message, missing: e.missing });
      } else {
        setError({ message: "Unexpected error", missing: [] });
      }
    } finally {
      setBusy(null);
    }
  };

  const ignore = async () => {
    if (busy) return;
    setBusy("ignore");
    setError(null);
    try {
      await api.ignore({
        storeType: item.storeType,
        storeProductId: item.storeProductId,
      });
      toast("Ignored", "info");
      onRemove();
    } catch (e) {
      setError({
        message: e instanceof ApiError ? e.message : "Unexpected error",
        missing: [],
      });
    } finally {
      setBusy(null);
    }
  };

  // Keep the parent's keyboard handlers pointed at the latest closures.
  const actionsRef = useRef<QueueCardActions>({ approve, ignore });
  useEffect(() => {
    actionsRef.current = { approve, ignore };
  });
  useEffect(() => {
    if (!registerActions) return;
    registerActions({
      approve: () => actionsRef.current.approve(),
      ignore: () => actionsRef.current.ignore(),
    });
    return () => registerActions(null);
  }, [registerActions]);

  const size = item.sizeText ?? formatSize(item.quantity, item.unitText);

  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        "card-in flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card transition-[border-color,box-shadow] duration-150",
        selected
          ? "border-primary/60 ring-2 ring-primary/25"
          : "border-border hover:shadow-raised",
        leaving && "card-out",
      )}
    >
      <div className="flex items-start gap-4">
        <ProductThumb src={item.imageUrl} alt={item.name} className="size-24 rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-snug">{item.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {[item.brand ?? "no brand", size ?? "no size"].join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <StoreBadge storeType={item.storeType} />
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open retailer page"
                  className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-base">
            <span className="font-semibold tabular-nums">
              {formatPrice(item.price) ?? "—"}
            </span>
            {item.oldPrice !== null && (
              <span className="ml-2 text-sm text-muted-foreground line-through">
                {formatPrice(item.oldPrice)}
              </span>
            )}
          </p>
          {item.missing.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.missing.map((f) => (
                <GateBadge key={f} field={f} />
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === "legacy" && item.legacy && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
          <p className="font-semibold text-amber-700 dark:text-amber-300">
            currently: <span className="font-mono">{item.legacy.ean}</span>
          </p>
          <p className="mt-0.5 text-muted-foreground">
            {item.legacy.name} — picking an EAN renames this synthetic product or
            merges it into an existing one.
          </p>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Candidates ({item.candidates.length})
        </p>
        {item.candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No candidates — enter an EAN manually or ignore.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {item.candidates.map((c) => (
              <CandidateRow
                key={`${c.source}-${c.ean}`}
                candidate={c}
                item={item}
                type={mode === "queue" ? "checkbox" : "radio"}
                name={radioName}
                checked={
                  mode === "queue" ? checked.includes(c.ean) : selectedEan === c.ean
                }
                onSelect={() =>
                  mode === "queue" ? toggle(c.ean) : setSelectedEan(c.ean)
                }
              />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mode === "legacy" && (
          <input
            type="radio"
            name={radioName}
            checked={selectedEan === CUSTOM}
            onChange={() => setSelectedEan(CUSTOM)}
            className="size-4 accent-primary"
            aria-label="Use custom EAN"
          />
        )}
        <span className="text-xs text-muted-foreground">Custom EAN</span>
        <Input
          inputMode="numeric"
          value={customEan}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
            setCustomEan(digits);
            if (mode === "legacy" && digits) setSelectedEan(CUSTOM);
          }}
          placeholder="8–14 digits"
          className="h-8 w-44 font-mono text-xs"
        />
        {customEan && !customValid && (
          <span className="text-xs text-destructive">must be 8–14 digits</span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error.message}
          {error.missing.length > 0 && (
            <span> — missing: {error.missing.join(", ")}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={eans.length === 0 || busy !== null}
          onClick={approve}
        >
          {busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />}
          Approve{mode === "queue" && eans.length > 0 ? ` (${eans.length})` : ""}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={busy !== null}
          onClick={ignore}
        >
          {busy === "ignore" ? <Loader2 className="animate-spin" /> : <Ban />}
          Ignore
        </Button>
        {selected && (
          <span className="ml-auto hidden text-[11px] text-muted-foreground sm:block">
            A approve · I ignore · Esc deselect
          </span>
        )}
      </div>
    </div>
  );
}
