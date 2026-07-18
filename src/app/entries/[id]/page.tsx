import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getEntryById } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDateTime, isValidId, labelize } from "@/lib/format";

import { AttachmentForm, ReferenceForm, ThreadForm } from "./entry-related-forms";
import { PromoteQuestionForm } from "./promote-question-form";
import { deleteEntryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) notFound();

  try {
    const entry = await getEntryById(id);

    if (!entry) {
      notFound();
    }

    const trackedQuestion = entry.type === "question" ? entry.questions[0] : undefined;
    const canPromoteToQuestion = !trackedQuestion && entry.questions.length === 0;

    return (
      <article className="mx-auto grid max-w-4xl gap-6">
        <header className="border-b border-border pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{labelize(entry.type)}</Badge>
                <Badge>{labelize(entry.status)}</Badge>
                <Badge tone={entry.privacyLevel === "sensitive" ? "amber" : "neutral"}>{labelize(entry.privacyLevel)}</Badge>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">{entry.title}</h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end shrink-0">
              {trackedQuestion ? (
                <Link
                  href={`/questions/${trackedQuestion.id}`}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-caution/30 bg-caution/8 px-4 text-sm font-medium text-caution transition-colors duration-150 hover:bg-caution/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caution/30 sm:w-auto"
                >
                  Tracked question
                </Link>
              ) : canPromoteToQuestion ? (
                <PromoteQuestionForm entryId={entry.id} />
              ) : null}
              <ButtonLink href={`/entries/${entry.id}/edit`} variant="primary" className="w-full sm:w-auto">
                Edit
              </ButtonLink>
              <DeleteForm
                action={deleteEntryAction.bind(null, entry.id)}
                title="Delete entry"
                message="This permanently deletes the entry. This cannot be undone."
                triggerLabel="Delete"
                triggerClassName="w-full sm:w-auto"
              />
            </div>
          </div>
          <dl className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="font-medium text-foreground">Captured</dt>
              <dd>{formatDateTime(entry.capturedAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Occurred</dt>
              <dd>{formatDateTime(entry.occurredAt)}</dd>
            </div>
          </dl>
        </header>

        {entry.summary && (
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Summary</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
          </section>
        )}

        <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Body</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-7">{entry.body}</div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Themes</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.themes.length ? (
                entry.themes.map((theme) => (
                  <Link key={theme.id} href={`/themes/${theme.slug}`} className="transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-md">
                    <Badge>{theme.name}</Badge>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No themes linked.</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Projects</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.projects.length ? (
                entry.projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`} className="transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-md">
                    <Badge tone="blue">{project.name}</Badge>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No projects linked.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Provenance</h2>
          <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="font-medium text-foreground">Source</dt>
              <dd>{entry.source ?? "Not specified"}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Confidence</dt>
              <dd>{entry.confidence ?? "Not specified"}</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Questions</h2>
            <div className="mt-3 grid gap-2">
              {entry.questions.length ? (
                entry.questions.map((question) => (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Badge tone="amber">{labelize(question.status)}</Badge>
                    <span className="ml-2">{question.prompt}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No questions linked.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Threads</h2>
            <div className="mt-3 grid gap-2">
              {entry.threads.length ? (
                entry.threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/threads/${thread.slug}`}
                    className="rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {thread.title}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No threads linked.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">References</h2>
            <div className="mt-3 grid gap-3">
              {entry.references.length ? (
                entry.references.map((reference) => (
                  <div key={reference.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <Badge>{labelize(reference.kind)}</Badge>
                    <p className="mt-2 text-sm font-medium">{reference.title}</p>
                    {reference.url && <p className="mt-1 break-all text-xs text-muted-foreground">{reference.url}</p>}
                    {reference.description && (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{reference.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No references linked.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Attachments</h2>
            <div className="mt-3 grid gap-3">
              {entry.attachments.length ? (
                entry.attachments.map((attachment) => (
                  <div key={attachment.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <p className="text-sm font-medium">{attachment.title ?? attachment.path}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{attachment.path}</p>
                    {(attachment.mediaType || attachment.sizeBytes) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[attachment.mediaType, attachment.sizeBytes ? `${attachment.sizeBytes} bytes` : undefined]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                    {attachment.description && (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{attachment.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No attachment metadata linked.</p>
              )}
            </div>
          </div>
        </section>

        {entry.excerpts.length > 0 && (
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Citations</h2>
            <div className="mt-3 grid gap-3">
              {entry.excerpts.map((excerpt) => (
                <div key={excerpt.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <blockquote className="border-l-2 border-border pl-3 text-sm italic leading-6 text-muted-foreground">
                    &ldquo;{excerpt.text}&rdquo;
                  </blockquote>
                  {excerpt.note && <p className="mt-1 text-sm leading-6">{excerpt.note}</p>}
                  <Link
                    href={`/sources/${excerpt.sourceId}`}
                    className="mt-1 inline-block text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    From: {excerpt.sourceTitle}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">Add reference</h2>
              <ReferenceForm entryId={entry.id} />
            </div>
            <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">Add attachment metadata</h2>
              <AttachmentForm entryId={entry.id} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Create thread</h2>
            <ThreadForm entryId={entry.id} />
          </div>
        </section>
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
