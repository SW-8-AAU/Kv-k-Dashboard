"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Inline API-error surface with the real message and a retry action. Every
 *  list fetch renders this instead of silently showing an empty state. */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="card-in flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3"
    >
      <AlertTriangle className="size-4 shrink-0 text-destructive" />
      <p className="min-w-0 flex-1 text-sm text-destructive">{message}</p>
      <Button size="sm" onClick={onRetry}>
        <RotateCw /> Retry
      </Button>
    </div>
  );
}
