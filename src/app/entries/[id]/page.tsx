import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getEntryById } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, ButtonLink, DetailHeader, Panel, PanelTitle } from "@/components/ui";
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
        <DetailHeader
          badges={
            <>
              <Badge tone="blue">{labelize(entry.type)}</Badge>
              <Badge>{labelize(entry.status)}</Badge>
              <Badge tone={entry.privacyLevel === "sensitive" ? "amber" : "neutral"}>
                {labelize(entry.privacyLevel)}
              </Badge>
            </>
          }
          title={entry.title}
          meta={
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-foreground">Captured</dt>
                <dd className="font-mono text-xs">{formatDateTime(entry.capturedAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Occurred</dt>
                <dd className="font-mono text-xs">{formatDateTime(entry.occurredAt)}</dd>
              </div>
            </dl>
          }
          actions={
            <>
              {trackedQuestion ? (
                <Link
                  href={`/questions/${trackedQuestion.id}`}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-caution/30 bg-caution/8 px-4 text-sm font-medium text-caution transition-colors duration-150 hover:bg-caution/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caution/30 sm:w-auto"
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
            </>
          }
        />

        {entry.summary && (
          <Panel>
            <PanelTitle>Summary</PanelTitle>
            <p className="text-sm leading-6 text-muted-foreground">{entry.summary}</p>
          </Panel>
        )}

        <Panel>
          <PanelTitle>Body</PanelTitle>
          {/* Entry bodies are reading content, so they get the serif reading
              surface rather than interface sans. */}
          <div className="reading whitespace-pre-wrap">{entry.body}</div>
        </Panel>

        <section className="grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelTitle>Themes</PanelTitle>
            <div className="flex flex-wrap gap-2">
              {entry.themes.length ? (
                entry.themes.map((theme) => (
                  <Link
                    key={theme.id}
                    href={`/themes/${theme.slug}`}
                    className="cursor-pointer rounded-md transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Badge>{theme.name}</Badge>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No themes linked.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <PanelTitle>Projects</PanelTitle>
            <div className="flex flex-wrap gap-2">
              {entry.projects.length ? (
                entry.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="cursor-pointer rounded-md transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Badge tone="blue">{project.name}</Badge>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No projects linked.</p>
              )}
            </div>
          </Panel>
        </section>

        <Panel>
          <PanelTitle>Provenance</PanelTitle>
          <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="font-medium text-foreground">Source</dt>
              <dd>{entry.source ?? "Not specified"}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Confidence</dt>
              <dd>{entry.confidence ?? "Not specified"}</dd>
            </div>
          </dl>
        </Panel>

        <section className="grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelTitle>Questions</PanelTitle>
            <div className="grid gap-2">
              {entry.questions.length ? (
                entry.questions.map((question) => (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Badge tone="amber">{labelize(question.status)}</Badge>
                    <span className="ml-2">{question.prompt}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No questions linked.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Threads</PanelTitle>
            <div className="grid gap-2">
              {entry.threads.length ? (
                entry.threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/threads/${thread.slug}`}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {thread.title}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No threads linked.</p>
              )}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelTitle>References</PanelTitle>
            <div className="grid gap-3">
              {entry.references.length ? (
                entry.references.map((reference) => (
                  <div key={reference.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <Badge>{labelize(reference.kind)}</Badge>
                    <p className="mt-2 text-sm font-medium">{reference.title}</p>
                    {reference.url && <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{reference.url}</p>}
                    {reference.description && (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{reference.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No references linked.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Attachments</PanelTitle>
            <div className="grid gap-3">
              {entry.attachments.length ? (
                entry.attachments.map((attachment) => (
                  <div key={attachment.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <p className="text-sm font-medium">{attachment.title ?? attachment.path}</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{attachment.path}</p>
                    {(attachment.mediaType || attachment.sizeBytes) && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
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
          </Panel>
        </section>

        {entry.excerpts.length > 0 && (
          <Panel>
            <PanelTitle>Citations</PanelTitle>
            <div className="grid gap-3">
              {entry.excerpts.map((excerpt) => (
                <div key={excerpt.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <blockquote className="serif-italic border-l-2 border-border pl-3 text-sm leading-6 text-muted-foreground">
                    &ldquo;{excerpt.text}&rdquo;
                  </blockquote>
                  {excerpt.note && <p className="mt-1 text-sm leading-6">{excerpt.note}</p>}
                  <Link
                    href={`/sources/${excerpt.sourceId}`}
                    className="mt-1 inline-block cursor-pointer text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    From: {excerpt.sourceTitle}
                  </Link>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <section className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelTitle>Add reference</PanelTitle>
              <ReferenceForm entryId={entry.id} />
            </Panel>
            <Panel>
              <PanelTitle>Add attachment metadata</PanelTitle>
              <AttachmentForm entryId={entry.id} />
            </Panel>
          </div>
          <Panel>
            <PanelTitle>Create thread</PanelTitle>
            <ThreadForm entryId={entry.id} />
          </Panel>
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
