import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

// One superfamily, three roles: sans drives the interface, serif carries
// long-form reading (transcripts, entry bodies), mono carries data.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-plex-serif",
  display: "swap",
  weight: ["400", "600"],
  style: ["normal", "italic"],
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
      className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable}${mode === "dark" ? " dark" : ""}`}
      data-theme={theme}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
