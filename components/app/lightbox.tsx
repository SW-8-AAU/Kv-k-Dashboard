"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";

interface LightboxImage {
  src: string;
  alt: string;
}

const LightboxContext = createContext<(src: string, alt: string) => void>(() => {});

/** Call to open an image in the fullscreen lightbox. */
export function useLightbox() {
  return useContext(LightboxContext);
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [img, setImg] = useState<LightboxImage | null>(null);
  const open = useCallback((src: string, alt: string) => setImg({ src, alt }), []);
  const close = useCallback(() => setImg(null), []);

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!img) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [img, close]);

  return (
    <LightboxContext.Provider value={open}>
      {children}
      {img && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={img.alt}
          onClick={close}
          className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute right-4 top-4 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          {/* Fixed display width so small and large source images render at a
              consistent size instead of their natural px. */}
          <img
            src={img.src}
            alt={img.alt}
            onClick={(e) => e.stopPropagation()}
            className="h-auto max-h-[85vh] w-[min(90vw,600px)] rounded-xl bg-white object-contain shadow-2xl"
          />
        </div>
      )}
    </LightboxContext.Provider>
  );
}
