// Theme registry — the single source of truth for which themes exist.
//
// It lives here rather than in theme-switcher.tsx because that file is a
// client module: a Server Component importing a plain value from it gets a
// client reference proxy instead of the array, so `themes.map` blows up at
// request time (which is exactly what /settings did). Plain modules are safe
// to import from both sides.
//
// Adding a theme means adding an entry here plus the two matching selectors in
// globals.css — ThemeName is derived, so a typo in one of the two places is a
// type error rather than a silent no-op.
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

export const DEFAULT_THEME: ThemeName = "vellum";
export const DEFAULT_MODE: ThemeMode = "light";

export function isThemeName(value: string | undefined | null): value is ThemeName {
  return themes.some((t) => t.name === value);
}
