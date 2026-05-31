import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Personal Context System",
  description: "Private local-first context layer for Gerald's thinking and AI workflows.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("pcs-theme")?.value ?? "ink";
  const mode = cookieStore.get("pcs-mode")?.value ?? "light";

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${spaceMono.variable}${mode === "dark" ? " dark" : ""}`}
      data-theme={theme}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
