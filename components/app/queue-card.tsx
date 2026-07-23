"use client";

import { useState } from "react";
import { Ban, Check, ExternalLink, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Candidate, QueueItem } from "@/lib/types";
import { cn, EAN_PATTERN, formatPrice, formatSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MissingBadge, SourceBadge, StoreBadge } from "./badges";
import { ProductThumb } from "./product-thumb";
import { useToast } from "./toaster";

const CUSTOM = "__custom__";

interface CardError {
  message: string;
  missing: string[];
}

export function QueueCard({
  item,
  mode,
  onRemove,
}: {
  item: QueueItem;
  /** "queue": multi-select checkboxes + custom EAN. "legacy": exactly one EAN via radios. */
  mode: "queue" | "legacy";
  onRemove: () => void;
}) {
  const toast = useToast();
  const [checked, setChecked] = useState<string[]>(() =>
    mode === "queue" && item.bucket === "match"
      ? item.candidates.map((c) => c.ean)
      : [],
  );
  const [selected, setSelected] = useState<string>("");
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
      : selected === CUSTOM
        ? customValid
          ? [customEan]
          : []
        : selected
          ? [selected]
          : [];

  const toggle = (ean: string) =>
    setChecked((prev) =>
      prev.includes(ean) ? prev.filter((e) => e !== ean) : [...prev, ean],
    );

  const approve = async () => {
    if (eans.length === 0) return;
    setBusy("approve");
    setError(null);
    try {
      const result = await api.createLink({
        storeType: item.storeType,
        storeProductId: item.storeProductId,
        eans,
      });
      if (result.status === "linked") {
        const created = result.created?.length
          ? `, created ${result.created.length}`
          : "";
        toast(`Linked ${result.linked?.length ?? eans.length} EAN(s)${created}`, "success");
      } else {
        toast(`${result.status}${result.ean ? ` → ${result.ean}` : ""}`, "success");
      }
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

  const size = item.sizeText ?? formatSize(item.quantity, item.unitText);
  const subtitle = [item.brand, size].filter(Boolean).join(" · ");

  return (
    <div className="fade-in flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <ProductThumb src={item.imageUrl} alt={item.name} className="size-16" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.name}</p>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
          <p className="mt-0.5 text-sm">
            <span className="font-semibold">{formatPrice(item.price) ?? "—"}</span>
            {item.oldPrice !== null && (
              <span className="ml-2 text-muted-foreground line-through">
                {formatPrice(item.oldPrice)}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <StoreBadge storeType={item.storeType} />
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open retailer page"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
          {item.missing.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {item.missing.map((f) => (
                <MissingBadge key={f} field={f} />
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === "legacy" && item.legacy && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
          <p className="font-medium text-amber-700 dark:text-amber-300">
            Current synthetic product
          </p>
          <p className="mt-0.5">
            <span className="font-mono">{item.legacy.ean}</span>
            <span className="ml-2 text-muted-foreground">{item.legacy.name}</span>
          </p>
        </div>
      )}

      {item.candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No candidates.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {item.candidates.map((c) => (
            <CandidateRow
              key={`${c.source}-${c.ean}`}
              candidate={c}
              type={mode === "queue" ? "checkbox" : "radio"}
              name={radioName}
              checked={mode === "queue" ? checked.includes(c.ean) : selected === c.ean}
              onSelect={() =>
                mode === "queue" ? toggle(c.ean) : setSelected(c.ean)
              }
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {mode === "legacy" && (
          <input
            type="radio"
            name={radioName}
            checked={selected === CUSTOM}
            onChange={() => setSelected(CUSTOM)}
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
            if (mode === "legacy" && digits) setSelected(CUSTOM);
          }}
          placeholder="8–14 digits"
          className="h-8 w-44 font-mono text-xs"
        />
        {customEan && !customValid && (
          <span className="text-xs text-destructive">must be 8–14 digits</span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
      </div>
    </div>
  );
}

function CandidateRow({
  candidate: c,
  type,
  name,
  checked,
  onSelect,
}: {
  candidate: Candidate;
  type: "checkbox" | "radio";
  name: string;
  checked: boolean;
  onSelect: () => void;
}) {
  const size = formatSize(c.quantity, c.unitText);
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors",
          checked
            ? "border-primary/50 bg-primary/5"
            : "border-border/70 hover:bg-accent/50",
        )}
      >
        <input
          type={type}
          name={type === "radio" ? name : undefined}
          checked={checked}
          onChange={onSelect}
          className="size-4 shrink-0 accent-primary"
        />
        <ProductThumb src={c.imageUrl} alt={c.name ?? c.ean} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{c.name ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[c.brand, size].filter(Boolean).join(" · ") || "—"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {c.reason} · score {c.score.toFixed(2)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-xs">{c.ean}</span>
          <SourceBadge source={c.source} />
        </div>
      </label>
    </li>
  );
}
