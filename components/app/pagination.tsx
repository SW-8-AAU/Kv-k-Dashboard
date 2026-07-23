"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  total,
  hasNext,
  disabled,
  onPageChange,
}: {
  page: number;
  /** Known page count (from total/limit). Omit when the API has no total. */
  pageCount?: number;
  total?: number;
  /** Overrides the next-button state when pageCount is unknown. */
  hasNext?: boolean;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  const prevDisabled = disabled || page <= 1;
  const nextDisabled =
    disabled ||
    (hasNext !== undefined
      ? !hasNext
      : pageCount !== undefined
        ? page >= pageCount
        : false);

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Page {page}
        {pageCount !== undefined ? ` of ${Math.max(pageCount, 1)}` : ""}
        {total !== undefined ? ` · ${total} items` : ""}
      </span>
      <div className="flex gap-1.5">
        <Button size="sm" disabled={prevDisabled} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft /> Prev
        </Button>
        <Button size="sm" disabled={nextDisabled} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
