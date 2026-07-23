"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Copy,
  History,
  Inbox,
  Link2,
  LogOut,
  ScanBarcode,
} from "lucide-react";
import { clearToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStats } from "./stats-provider";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  attention?: boolean;
}

/** App-shell sidebar: navigation with live count badges from /dashboard/stats.
 *  Full labels on large screens, icon rail below the lg breakpoint. */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { stats } = useStats();

  if (pathname === "/login") return null;

  const queueCount = (stats?.queue ?? []).reduce((sum, r) => sum + r.count, 0);
  const curatedCount = (stats?.links ?? [])
    .filter((r) => r.linkSource === "manual" || r.linkSource === "auto-approved")
    .reduce((sum, r) => sum + r.count, 0);
  const dupCount = stats?.pendingDuplicates ?? 0;

  const items: NavItem[] = [
    { href: "/", label: "Queue", icon: <Inbox />, count: queueCount },
    { href: "/matched", label: "Matched", icon: <Link2 />, count: curatedCount },
    {
      href: "/duplicates",
      label: "Duplicates",
      icon: <Copy />,
      count: dupCount,
      attention: dupCount > 0,
    },
    { href: "/legacy", label: "Legacy", icon: <History /> },
  ];

  return (
    <aside className="sticky top-0 z-40 flex h-dvh w-14 shrink-0 flex-col border-r border-border bg-card/60 lg:w-56">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-3 lg:px-4">
        <ScanBarcode className="size-5 shrink-0 text-primary" />
        <span className="hidden text-sm font-semibold tracking-tight lg:block">
          Curation
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={
                item.count !== undefined
                  ? `${item.label} (${item.count})`
                  : item.label
              }
              className={cn(
                "relative flex items-center justify-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors duration-150 lg:justify-start lg:px-2.5 [&_svg]:size-[18px] [&_svg]:shrink-0",
                active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.icon}
              {/* Icon-rail badge: a small dot when a count is pending. */}
              {item.attention && (
                <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-amber-500 lg:hidden" />
              )}
              <span className="hidden flex-1 lg:block">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={cn(
                    "hidden min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums lg:block",
                    item.attention
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1 border-t border-border p-2 lg:flex-row lg:justify-between lg:px-3">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Log out"
          onClick={() => {
            clearToken();
            router.replace("/login");
          }}
        >
          <LogOut />
        </Button>
      </div>
    </aside>
  );
}
