"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Route-level error boundary: no page can white-screen. Shows the actual
 *  error message and offers a reset that re-renders the failed segment. */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="card-in flex w-full max-w-lg flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <h1 className="font-semibold">Something went wrong on this page</h1>
          <p className="mt-1.5 break-words text-sm text-muted-foreground">
            {error.message || "Unknown client-side error"}
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              digest: {error.digest}
            </p>
          )}
        </div>
        <Button variant="primary" onClick={reset}>
          <RotateCw /> Try again
        </Button>
      </div>
    </div>
  );
}
