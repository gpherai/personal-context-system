"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Archive,
  BookMarked,
  BookOpen,
  GitBranch,
  Home,
  ListTree,
  PenLine,
  Settings,
  Terminal,
} from "lucide-react";

import { cn } from "@/lib/cn";

const navGroups = [
  {
    label: "Workflow",
    items: [
      { href: "/",        label: "Dashboard", icon: Home     },
      { href: "/capture", label: "Capture",   icon: PenLine  },
      { href: "/ledger",  label: "Ledger",    icon: BookOpen }
    ]
  },
  {
    label: "Browse",
    items: [
      { href: "/cabinet", label: "Cabinet",   icon: Archive    },
      { href: "/sources", label: "Sources",   icon: BookMarked },
      { href: "/threads", label: "Threads",   icon: ListTree   },
      { href: "/map",     label: "Map",       icon: GitBranch  }
    ]
  },
  {
    label: "System",
    items: [
      { href: "/command",  label: "Command",  icon: Terminal },
      { href: "/settings", label: "Settings", icon: Settings }
    ]
  }
];

export function NavLinks() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <nav
      aria-label="Primary navigation"
      className="flex gap-0.5 overflow-x-auto py-2 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] lg:flex-col lg:gap-1 lg:overflow-x-visible lg:[mask-image:none]"
    >
      {navGroups.map((group, groupIndex) => (
        <div key={group.label} className={cn("contents lg:flex lg:flex-col lg:gap-0.5", groupIndex > 0 && "lg:mt-2 lg:border-t lg:border-border lg:pt-2")}>
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                ref={isActive ? activeRef : undefined}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:flex",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
