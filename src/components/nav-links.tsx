"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, BookOpen, Command, GitBranch, Home, ListTree, PenLine, Settings } from "lucide-react";

import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/capture", label: "Capture", icon: PenLine },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/cabinet", label: "Cabinet", icon: Archive },
  { href: "/threads", label: "Threads", icon: ListTree },
  { href: "/map", label: "Map", icon: GitBranch },
  { href: "/command", label: "Command", icon: Command },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-1 overflow-x-auto lg:block lg:space-y-1" aria-label="Primary navigation">
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
  );
}

