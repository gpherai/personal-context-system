import Link from "next/link";
import { Boxes } from "lucide-react";
import type { ReactNode } from "react";

import { NavLinks } from "./nav-links";
import { ModeToggle, ThemeSwitcher } from "./theme-switcher";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-primary focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-lg focus:outline-none"
        href="#main"
      >
        Skip to main content
      </a>

      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col border-b border-border bg-surface lg:border-b-0 lg:border-r">
          {/* Brand */}
          <div className="shrink-0 px-4 pt-5 pb-2 lg:px-5">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary shadow-sm">
                  <Boxes className="h-4 w-4 text-[var(--color-primary-foreground)]" aria-hidden="true" />
                </div>
                <span className="truncate text-sm font-semibold text-foreground">
                  Personal Context System
                </span>
              </Link>
              {/* Dark/light toggle — only visible on mobile; desktop uses sidebar footer */}
              <div className="lg:hidden">
                <ModeToggle />
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 lg:px-3">
            <NavLinks />
          </div>

          {/* Theme switcher — visible on desktop sidebar footer */}
          <div className="hidden shrink-0 border-t border-border lg:block">
            <ThemeSwitcher />
          </div>
        </aside>

        <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
