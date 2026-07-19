import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSourcesByTheme, getThemeBySlug, listThemes } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, DetailHeader, Panel, PanelTitle } from "@/components/ui";
import { parseThemeMetadata } from "@/domain/context";
import { sourceTypeDetails } from "@/domain/taxonomy";
import { deleteThemeAction } from "./actions";
import { MergeThemeForm, RenameThemeForm } from "./theme-forms";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  tag: "Tag"
};

const categoryTones: Record<string, "blue" | "teal" | "amber" | "neutral"> = {
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
      <div className="mx-auto grid max-w-4xl gap-6">
        <DetailHeader
          backHref="/cabinet"
          backLabel="Cabinet"
          badges={
            category ? (
              <Badge tone={categoryTones[category] ?? "neutral"}>
                {categoryLabels[category] ?? category}
              </Badge>
            ) : (
              <Badge tone="teal">Theme</Badge>
            )
          }
          title={theme.name}
          description={theme.description}
          meta={
            aliases.length > 0 ? (
              <>
                <span className="font-medium">Also known as:</span> {aliases.join(", ")}
              </>
            ) : undefined
          }
          actions={
            theme.entries.length === 0 ? (
              <DeleteForm
                action={deleteThemeAction.bind(null, theme.id)}
                title="Delete theme"
                message={`Permanently delete the theme "${theme.name}"? This cannot be undone.`}
                triggerLabel="Delete"
              />
            ) : undefined
          }
        />

        {sources.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-sm font-semibold">Sources</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {sources.map((source) => (
                <Link
                  key={source.id}
                  href={`/sources/${source.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
                >
                  <span className="line-clamp-1">{source.title}</span>
                  <Badge tone="neutral">{sourceTypeDetails[source.type].label}</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {theme.entries.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-sm font-semibold">Entries</h2>
            <EntryList entries={theme.entries} />
          </section>
        )}

        {theme.entries.length === 0 && sources.length === 0 && (
          <p className="text-sm text-muted-foreground">No entries or sources linked to this theme.</p>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelTitle>Name and description</PanelTitle>
            <RenameThemeForm themeId={theme.id} name={theme.name} description={theme.description} />
          </Panel>
          <Panel>
            <PanelTitle>Merge with another theme</PanelTitle>
            <MergeThemeForm themeId={theme.id} otherThemes={otherThemes} />
          </Panel>
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
