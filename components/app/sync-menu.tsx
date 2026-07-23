"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Loader2, RefreshCw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "./toaster";

type ActionId = "rematch" | "sync-lidl" | "sync-rema";

interface Action {
  id: ActionId;
  label: string;
  hint: string;
  icon: React.ReactNode;
  run: () => Promise<unknown>;
}

const ACTIONS: Action[] = [
  {
    id: "rematch",
    label: "Rematch queue",
    hint: "Recompute match suggestions",
    icon: <RefreshCw className="size-4" />,
    run: () => api.rematch(),
  },
  {
    id: "sync-lidl",
    label: "Sync Lidl",
    hint: "Pull the Lidl catalogue",
    icon: <Download className="size-4" />,
    run: () => api.sync("lidl"),
  },
  {
    id: "sync-rema",
    label: "Sync Rema",
    hint: "Pull the Rema catalogue",
    icon: <Download className="size-4" />,
    run: () => api.sync("rema"),
  },
  {
    id: "sync-tjek",
    label: "Sync leaflets",
    hint: "MENY, SPAR & Min Købmand tilbudsaviser",
    icon: <Download className="size-4" />,
    run: () => api.sync("tjek"),
  },
];

/** All background jobs behind one dropdown; each row shows its own spinner. */
export function SyncMenu() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<ActionId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = async (action: Action) => {
    setRunning(action.id);
    try {
      await action.run();
      toast(`${action.label} started`, "success");
      setOpen(false);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : `${action.label} failed`, "error");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {running ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        Sync
        <ChevronDown
          className={cn("transition-transform duration-150", open && "rotate-180")}
        />
      </Button>
      {open && (
        <div
          role="menu"
          className="pop-in absolute right-0 top-full z-40 mt-1.5 w-60 rounded-lg border border-border bg-popover p-1 shadow-raised"
        >
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              disabled={running !== null}
              onClick={() => run(action)}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-accent disabled:cursor-default disabled:opacity-50"
            >
              <span className="text-muted-foreground">
                {running === action.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  action.icon
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{action.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {action.hint}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
