"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLightbox } from "./lightbox";

/** Product image with a graceful fallback. Click to open in the lightbox. */
export function ProductThumb({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const openLightbox = useLightbox();
  const base = cn(
    "size-12 shrink-0 rounded-md bg-muted object-contain ring-1 ring-foreground/10",
    className,
  );
  if (!src || failed) {
    return (
      <div className={cn(base, "flex items-center justify-center")}>
        <ImageOff className="size-4 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn(base, "cursor-zoom-in transition hover:ring-2 hover:ring-primary/40")}
      onClick={(e) => {
        // Don't let the click bubble to a surrounding control (e.g. a
        // selectable candidate row) — just open the lightbox.
        e.stopPropagation();
        openLightbox(src, alt);
      }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
