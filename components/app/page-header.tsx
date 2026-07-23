"use client";

import { SyncMenu } from "./sync-menu";

/** Sticky per-page top bar: title + subtitle on the left, the page's own
 *  filters/search in the middle, and the global Sync menu on the right. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-border bg-background/85 px-4 pb-3 pt-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {children}
          <SyncMenu />
        </div>
      </div>
    </div>
  );
}
