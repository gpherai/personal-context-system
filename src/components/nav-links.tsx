"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, BookMarked, BookOpen, Command, GitBranch, Home, ListTree, PenLine, Settings } from "lucide-react";

import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/capture", label: "Capture", icon: PenLine },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/cabinet", label: "Cabinet", icon: Archive },
  { href: "/sources", label: "Bronnen", icon: BookMarked },
  { href: "/threads", label: "Threads", icon: ListTree },
  { href: "/map", label: "Map", icon: GitBranch },
  { href: "/command", label: "Command", icon: Command },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="relative mt-4 lg:mt-0">
      <nav className="flex gap-1 overflow-x-auto lg:mt-4 lg:block lg:space-y-1 lg:overflow-x-visible" aria-label="Primary navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 lg:flex",
              isActive
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
      </nav>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-surface to-transparent lg:hidden" aria-hidden="true" />
    </div>
  );
}

