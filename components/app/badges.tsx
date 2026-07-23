import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import type { CandidateSource, MissingField, StoreType } from "@/lib/types";

const storeClasses: Record<StoreType, string> = {
  lidl: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  rema: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  salling:
    "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  meny:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  spar: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  "min-kobmand":
    "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
};

export function StoreBadge({ storeType }: { storeType: StoreType }) {
  const cls =
    storeClasses[storeType] ?? "border-border bg-muted text-muted-foreground";
  return <Badge className={cls}>{storeType}</Badge>;
}

const sourceClasses: Record<CandidateSource, string> = {
  products:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  off: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

export function SourceBadge({ source }: { source: CandidateSource }) {
  const cls =
    sourceClasses[source] ?? "border-border bg-muted text-muted-foreground";
  return <Badge className={cls}>{source === "off" ? "OFF" : source}</Badge>;
}

const linkSourceClasses: Record<string, string> = {
  barcode:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "auto-approved":
    "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  manual:
    "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "legacy-synthetic":
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export function LinkSourceBadge({ linkSource }: { linkSource: string }) {
  const cls =
    linkSourceClasses[linkSource] ??
    "border-border bg-muted text-muted-foreground";
  return <Badge className={cls}>{linkSource}</Badge>;
}

/** Approval-gate pill: the backend 422s promotion while a field is missing. */
export function GateBadge({ field }: { field: MissingField }) {
  return (
    <Tooltip
      label={`Approval is blocked: this listing has no ${field}. The backend requires image + quantity + unit before a product can be created or promoted.`}
    >
      <Badge className="cursor-help border-amber-500/50 bg-amber-500/15 font-semibold text-amber-700 dark:text-amber-300">
        <TriangleAlert className="size-3" />
        missing {field}
      </Badge>
    </Tooltip>
  );
}
