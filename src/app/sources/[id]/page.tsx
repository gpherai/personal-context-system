import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSourceById } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, isValidId, labelize } from "@/lib/format";
import { sourceTypeDetails } from "@/domain/taxonomy";
import type { SourceMetadata } from "@/domain/context";

export const dynamic = "force-dynamic";

function MetadataField({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function MetadataList({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{values.join(", ")}</dd>
    </div>
  );
}

function SourceMetadataSection({ metadata }: { metadata: SourceMetadata }) {
  switch (metadata.type) {
    case "video":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Channel" value={metadata.channel} />
          <MetadataField label="Duration (s)" value={metadata.duration} />
          <MetadataField label="Language" value={metadata.language} />
        </dl>
      );
    case "book":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataList label="Authors" values={metadata.authors} />
          <MetadataField label="ISBN" value={metadata.isbn} />
          <MetadataField label="Year" value={metadata.year} />
          <MetadataField label="Publisher" value={metadata.publisher} />
          <MetadataField label="Language" value={metadata.language} />
        </dl>
      );
    case "post":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Author" value={metadata.author} />
          <MetadataField label="Published" value={metadata.publishedAt} />
        </dl>
      );
    case "image":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Alt text" value={metadata.alt} />
          <MetadataField label="Photographer" value={metadata.photographer} />
        </dl>
      );
    case "sadhana":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Language" value={metadata.language} />
          <MetadataField label="Format" value={metadata.format} />
        </dl>
      );
    case "upadesha":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Language" value={metadata.language} />
          <MetadataField label="Format" value={metadata.format} />
        </dl>
      );
    case "stotra":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Language" value={metadata.language} />
          <MetadataField label="Script" value={metadata.script} />
        </dl>
      );
    case "deity_concept":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Language" value={metadata.language} />
          <MetadataList label="Aliases" values={metadata.aliases} />
        </dl>
      );
    case "teacher":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Tradition" value={metadata.tradition} />
          <MetadataField label="Lineage" value={metadata.lineage} />
          <MetadataField label="Language" value={metadata.language} />
          <MetadataField label="Period" value={metadata.period} />
        </dl>
      );
  }
}

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) notFound();

  try {
    const source = await getSourceById(id);

    if (!source) {
      notFound();
    }

    const typeDetail = sourceTypeDetails[source.type];

    return (
      <article className="mx-auto grid max-w-4xl gap-6">
        <header className="border-b border-border pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{typeDetail.label}</Badge>
                <Badge tone={source.status === "archived" ? "neutral" : "teal"}>{labelize(source.status)}</Badge>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">{source.title}</h1>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href={`/sources/${source.id}/edit`}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Edit
              </Link>
            </div>
          </div>
        </header>

        {source.description && (
          <section>
            <p className="text-sm leading-7 text-muted-foreground">{source.description}</p>
          </section>
        )}

        <section className="grid gap-4 border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">{typeDetail.label} details</h2>
          <SourceMetadataSection metadata={source.metadata} />
        </section>

        {source.body && (
          <section className="grid gap-3 border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold">Body</h2>
            <div className="whitespace-pre-wrap text-sm leading-7">{source.body}</div>
          </section>
        )}

        {source.references.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-sm font-semibold">References</h2>
            <div className="grid gap-2">
              {source.references.map((ref) => (
                <div key={ref.id} className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                  <p className="font-medium">{ref.title}</p>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {ref.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {source.themes.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-sm font-semibold">Themes</h2>
            <div className="flex flex-wrap gap-2">
              {source.themes.map((theme) => (
                <Link
                  key={theme.id}
                  href={`/themes/${theme.slug}`}
                  className="inline-flex h-8 items-center cursor-pointer rounded-md border border-border bg-surface px-3 text-sm transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {theme.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {source.entries.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-sm font-semibold">Linked entries</h2>
            <div className="grid gap-1">
              {source.entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/entries/${entry.id}`}
                  className="rounded-md px-2 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {entry.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          Created {formatDateTime(source.createdAt)} · Updated {formatDateTime(source.updatedAt)}
        </footer>
      </article>
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
