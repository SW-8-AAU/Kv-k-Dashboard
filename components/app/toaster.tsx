"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const kindClasses: Record<ToastKind, string> = {
  success:
    "border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  error:
    "border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
  info: "border-border bg-popover text-popover-foreground",
};

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, kind }]);
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "fade-in pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-lg",
              kindClasses[t.kind],
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
