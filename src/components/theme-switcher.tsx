"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/cn";

export type ThemeName = "ink" | "saffron" | "stone" | "brutalism";
export type ThemeMode = "light" | "dark";

const themes: { name: ThemeName; label: string; color: string }[] = [
  { name: "ink",       label: "Ink",       color: "oklch(53% 0.22 255)" },
  { name: "saffron",   label: "Saffron",   color: "oklch(58% 0.22 50)"  },
  { name: "stone",     label: "Stone",     color: "oklch(52% 0.18 195)" },
  { name: "brutalism", label: "Brutalism", color: "oklch(71% 0.16 143)" },
];

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|;)\\s*${name}=([^;]+)`));
  return m ? m[1] : undefined;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function applyToDOM(theme: ThemeName, mode: ThemeMode) {
  const html = document.documentElement;
  html.dataset.theme = theme;
  html.classList.toggle("dark", mode === "dark");
  writeCookie("pcs-theme", theme);
  writeCookie("pcs-mode", mode);
  localStorage.setItem("pcs-theme", theme);
  localStorage.setItem("pcs-mode", mode);
}

function useThemeState() {
  const [theme, setTheme] = useState<ThemeName>("ink");
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      const t = (readCookie("pcs-theme") ?? localStorage.getItem("pcs-theme") ?? "ink") as ThemeName;
      const m = (readCookie("pcs-mode") ?? localStorage.getItem("pcs-mode") ?? "light") as ThemeMode;
      setTheme(t);
      setMode(m);
      setMounted(true);
    });
  }, []);

  return { theme, setTheme, mode, setMode, mounted };
}

export function ModeToggle() {
  const { mode, setMode, theme, mounted } = useThemeState();

  if (!mounted) return <div className="h-11 w-11" aria-hidden="true" />;

  function toggleMode() {
    const next: ThemeMode = mode === "light" ? "dark" : "light";
    setMode(next);
    applyToDOM(theme, next);
  }

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
  const { theme, setTheme, mode, setMode, mounted } = useThemeState();

  function selectTheme(t: ThemeName) {
    setTheme(t);
    applyToDOM(t, mode);
  }

  function toggleMode() {
    const next: ThemeMode = mode === "light" ? "dark" : "light";
    setMode(next);
    applyToDOM(theme, next);
  }

  if (!mounted) return <div className="h-24" aria-hidden="true" />;

  return (
    <div className="grid gap-1 px-3 py-3">
      {/* Own row, centered: 4 × 44px touch targets + gaps already fill most of the
          240px sidebar width — sharing a row with the mode toggle overflowed it. */}
      <div className="flex items-center justify-center gap-2" role="group" aria-label="Select theme">
        {themes.map((t) => (
          <button
            key={t.name}
            type="button"
            aria-label={`${t.label} theme`}
            aria-pressed={theme === t.name}
            title={t.label}
            onClick={() => selectTheme(t.name)}
            className="group flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span
              className={cn(
                "h-5 w-5 rounded-full border-2 transition-transform duration-150 group-hover:scale-110",
                theme === t.name ? "border-foreground scale-110" : "border-transparent opacity-70"
              )}
              style={{ backgroundColor: t.color }}
            />
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
