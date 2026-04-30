import Link from "next/link";
import { Boxes } from "lucide-react";
import type { ReactNode } from "react";

import { NavLinks } from "./nav-links";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-primary focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-md focus:outline-none"
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
          <NavLinks />
        </aside>
        <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
