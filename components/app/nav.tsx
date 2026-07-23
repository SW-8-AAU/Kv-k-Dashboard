"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ScanBarcode } from "lucide-react";
import { clearToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const tabs = [
  { href: "/", label: "Queue" },
  { href: "/matched", label: "Matched" },
  { href: "/duplicates", label: "Duplicates" },
  { href: "/legacy", label: "Legacy" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-13 max-w-6xl items-center gap-3 px-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ScanBarcode className="size-5 text-primary" />
          Curation
        </span>
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
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
      </div>
    </header>
  );
}
