import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

// One superfamily, three roles: sans drives the interface, serif carries
// long-form reading (transcripts, entry bodies), mono carries data.
//
// Every weight × style pair listed here becomes its own preloaded file, so the
// lists are exactly what the app renders and nothing more.

// Plex Sans has a variable cut on Google Fonts: omitting `weight` ships one
// file that covers 400/500/600 instead of three static ones.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

// Serif has no variable cut, so weight × style is a real cross product. Italic
// is only ever used at 400 (blockquotes), so it gets its own call — asking for
// weight ["400","600"] × style ["normal","italic"] here would also ship a
// 600-italic face that nothing renders.
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-plex-serif",
  display: "swap",
  weight: ["400", "600"],
});

const plexSerifItalic = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-plex-serif-italic",
  display: "swap",
  weight: ["400"],
  style: ["italic"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Personal Context System",
  description: "Private local-first context layer for Gerald's thinking and AI workflows.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("pcs-theme")?.value ?? "vellum";
  const mode = cookieStore.get("pcs-mode")?.value ?? "light";

  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexSerif.variable} ${plexSerifItalic.variable} ${plexMono.variable}${mode === "dark" ? " dark" : ""}`}
      data-theme={theme}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
