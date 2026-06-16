import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSourcesByTheme, getThemeBySlug, listThemes } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { parseThemeMetadata } from "@/domain/context";
import { sourceTypeDetails } from "@/domain/taxonomy";
import { deleteThemeAction } from "./actions";
import { MergeThemeForm, RenameThemeForm } from "./theme-forms";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  deity: "Deity",
  tradition: "Tradition",
  topic: "Topic",
  tag: "Tag"
};

const categoryTones: Record<string, "blue" | "teal" | "amber" | "neutral"> = {
  deity: "blue",
  tradition: "teal",
  topic: "amber",
  tag: "neutral"
};

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const theme = await getThemeBySlug(slug);

    if (!theme) {
      notFound();
    }

    const { category, aliases } = parseThemeMetadata(theme.metadata);

    const [sources, allThemes] = await Promise.all([getSourcesByTheme(theme.slug), listThemes()]);
    const otherThemes = allThemes.filter((t) => t.id !== theme.id);

    return (
      <div className="mx-auto grid max-w-5xl gap-5">
        <header className="border-b border-border pb-5">
          <div className="flex items-start justify-between gap-4">
            <Link
              href="/cabinet"
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              ← Cabinet
            </Link>
            {theme.entries.length === 0 && (
              <DeleteForm
                action={deleteThemeAction.bind(null, theme.id)}
                confirmMessage={`Thema "${theme.name}" permanent verwijderen?`}
              >
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-danger/30 bg-danger/8 px-4 text-sm font-medium text-danger transition-colors duration-200 hover:bg-danger/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                >
                  Verwijderen
                </button>
              </DeleteForm>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {category ? (
              <Badge tone={categoryTones[category] ?? "neutral"}>
                {categoryLabels[category] ?? category}
              </Badge>
            ) : (
              <Badge tone="teal">Thema</Badge>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{theme.name}</h1>
          {theme.description && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{theme.description}</p>
          )}
          {aliases.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium">Ook bekend als:</span> {aliases.join(", ")}
            </p>
          )}
        </header>

        {sources.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-sm font-semibold">Sources</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {sources.map((source) => (
                <Link
                  key={source.id}
                  href={`/sources/${source.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-sm transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 cursor-pointer"
                >
                  <span className="line-clamp-1">{source.title}</span>
                  <Badge tone="neutral">{sourceTypeDetails[source.type].label}</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {theme.entries.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-sm font-semibold">Entries</h2>
            <EntryList entries={theme.entries} />
          </section>
        )}

        {theme.entries.length === 0 && sources.length === 0 && (
          <p className="text-sm text-muted-foreground">No entries or sources linked to this theme.</p>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Naam en beschrijving</h2>
            <RenameThemeForm themeId={theme.id} name={theme.name} description={theme.description} />
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Samenvoegen met ander thema</h2>
            <MergeThemeForm themeId={theme.id} otherThemes={otherThemes} />
          </div>
        </section>
      </div>
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return (
        <div className="mx-auto max-w-4xl">
          <SetupNotice />
        </div>
      );
    }

    throw error;
  }
}
