import { notFound } from "next/navigation";

import { isRecoverableReadError } from "@/application/errors";
import { getThemeBySlug } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const theme = await getThemeBySlug(slug);

    if (!theme) {
      notFound();
    }

    return (
      <div className="mx-auto grid max-w-5xl gap-5">
        <header className="border-b border-border pb-5">
          <Badge tone="teal">Theme</Badge>
          <h1 className="mt-3 text-3xl font-semibold">{theme.name}</h1>
          {theme.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{theme.description}</p>}
        </header>
        <EntryList entries={theme.entries} />
      </div>
    );
  } catch (error) {
    if (isRecoverableReadError(error)) {
      return (
        <div className="mx-auto max-w-4xl">
          <SetupNotice />
        </div>
      );
    }

    throw error;
  }
}
