"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/cn";

// Single source of truth. Adding a theme means adding an entry here plus the
// two matching selectors in globals.css — ThemeName is derived, so a typo in
// one of the two places is a type error rather than a silent no-op.
export const themes = [
  {
    name: "vellum",
    label: "Vellum",
    description: "Warm paper and ink indigo. Built for long reading.",
    base: "var(--swatch-vellum-base)",
    signal: "var(--swatch-vellum-signal)",
  },
  {
    name: "graphite",
    label: "Graphite",
    description: "Achromatic greys with a violet signal. Built for dense scanning.",
    base: "var(--swatch-graphite-base)",
    signal: "var(--swatch-graphite-signal)",
  },
] as const;

export type ThemeName = (typeof themes)[number]["name"];
export type ThemeMode = "light" | "dark";

const DEFAULT_THEME: ThemeName = "vellum";
const DEFAULT_MODE: ThemeMode = "light";

function isThemeName(value: string | undefined | null): value is ThemeName {
  return themes.some((t) => t.name === value);
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|;)\\s*${name}=([^;]+)`));
  return m ? m[1] : undefined;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

/* ------------------------------------------------------------------
   Theme store

   A module-level store rather than component state: ModeToggle and
   ThemeSwitcher render in different corners of the sidebar, and when each
   held its own useState copy, toggling one left the other stale. Reading it
   through useSyncExternalStore also gives a correct server snapshot, so no
   state has to be written from an effect on mount.
   ------------------------------------------------------------------ */

type ThemeState = { theme: ThemeName; mode: ThemeMode };

const SERVER_STATE: ThemeState = { theme: DEFAULT_THEME, mode: DEFAULT_MODE };

let listeners: (() => void)[] = [];
// getSnapshot must return a stable reference or React re-renders forever;
// the cache is dropped whenever the state actually changes.
let snapshot: ThemeState | null = null;

function subscribe(onChange: () => void): () => void {
  listeners = [...listeners, onChange];
  return () => {
    listeners = listeners.filter((listener) => listener !== onChange);
  };
}

function getSnapshot(): ThemeState {
  if (!snapshot) {
    const storedTheme = readCookie("pcs-theme") ?? localStorage.getItem("pcs-theme");
    const storedMode = readCookie("pcs-mode") ?? localStorage.getItem("pcs-mode");
    snapshot = {
      theme: isThemeName(storedTheme) ? storedTheme : DEFAULT_THEME,
      mode: storedMode === "dark" ? "dark" : DEFAULT_MODE,
    };
  }
  return snapshot;
}

function getServerSnapshot(): ThemeState {
  return SERVER_STATE;
}

function setThemeState(next: ThemeState) {
  const html = document.documentElement;
  html.dataset.theme = next.theme;
  html.classList.toggle("dark", next.mode === "dark");
  writeCookie("pcs-theme", next.theme);
  writeCookie("pcs-mode", next.mode);
  localStorage.setItem("pcs-theme", next.theme);
  localStorage.setItem("pcs-mode", next.mode);

  snapshot = next;
  for (const listener of listeners) listener();
}

function useThemeState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // False during SSR and the hydration pass, true afterwards — lets the
  // controls reserve their exact height instead of rendering a wrong value.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  return {
    ...state,
    hydrated,
    selectTheme: (theme: ThemeName) => setThemeState({ ...state, theme }),
    toggleMode: () => setThemeState({ ...state, mode: state.mode === "light" ? "dark" : "light" }),
  };
}

export function ModeToggle() {
  const { mode, hydrated, toggleMode } = useThemeState();

  // Same 44px box as the rendered button, so mounting shifts nothing.
  if (!hydrated) return <div className="h-11 w-11" aria-hidden="true" />;

  return (
    <button
      type="button"
      aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      onClick={toggleMode}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {mode === "dark"
        ? <Sun className="h-4 w-4" aria-hidden="true" />
        : <Moon className="h-4 w-4" aria-hidden="true" />
      }
    </button>
  );
}

export function ThemeSwitcher() {
  const { theme, mode, hydrated, selectTheme, toggleMode } = useThemeState();

  // py-3 (24) + swatch row (44) + gap-1 (4) + mode button (44) = 116px.
  if (!hydrated) return <div className="h-[116px]" aria-hidden="true" />;

  return (
    <div className="grid gap-1 px-3 py-3">
      <div className="flex items-center justify-center gap-2" role="group" aria-label="Select theme">
        {themes.map((t) => (
          <button
            key={t.name}
            type="button"
            aria-label={`${t.label} theme`}
            aria-pressed={theme === t.name}
            title={`${t.label} — ${t.description}`}
            onClick={() => selectTheme(t.name)}
            className={cn(
              "flex h-11 cursor-pointer items-center gap-2 rounded-md px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              theme === t.name
                ? "bg-surface-muted text-foreground"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            )}
          >
            {/* Two-tone swatch: the theme's page colour beside its signal colour,
                so the button previews what selecting it actually does. */}
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 overflow-hidden rounded-full border",
                theme === t.name ? "border-foreground" : "border-border"
              )}
            >
              <span className="h-full w-1/2" style={{ background: t.base }} />
              <span className="h-full w-1/2" style={{ background: t.signal }} />
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggleMode}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {mode === "dark"
          ? <Sun className="h-4 w-4" aria-hidden="true" />
          : <Moon className="h-4 w-4" aria-hidden="true" />
        }
        <span>{mode === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>
    </div>
  );
}
