import Link from "next/link";
import { Archive, BookOpen, Boxes, Command, GitBranch, Home, ListTree, PenLine, Settings } from "lucide-react";
import type { ReactNode } from "react";

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

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow"
        href="#main"
      >
        Skip to main content
      </a>
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-border bg-surface/90 px-4 py-4 lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex items-center gap-3 lg:block">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <Boxes className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="truncate">Personal Context System</span>
            </Link>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto lg:block lg:space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 lg:flex"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
