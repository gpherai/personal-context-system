"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BookMarked,
  BookOpen,
  Command,
  GitBranch,
  Home,
  ListTree,
  PenLine,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/cn";

const navItems = [
  { href: "/",        label: "Dashboard", icon: Home      },
  { href: "/capture", label: "Capture",   icon: PenLine   },
  { href: "/ledger",  label: "Ledger",    icon: BookOpen  },
  { href: "/cabinet", label: "Cabinet",   icon: Archive   },
  { href: "/sources", label: "Bronnen",   icon: BookMarked},
  { href: "/threads", label: "Threads",   icon: ListTree  },
  { href: "/map",     label: "Map",       icon: GitBranch },
  { href: "/command", label: "Command",   icon: Command   },
  { href: "/settings",label: "Settings",  icon: Settings  },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="flex gap-0.5 overflow-x-auto py-2 lg:flex-col lg:overflow-x-visible"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:flex",
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
    </nav>
  );
}
