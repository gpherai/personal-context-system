import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSourceById } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { SetupNotice } from "@/components/setup-notice";
import { Alert, Badge, ButtonLink, DetailHeader, Panel, PanelTitle } from "@/components/ui";
import { formatDateTime, isValidId, labelize } from "@/lib/format";
import { conversationProviderLabels, sourceTypeDetails } from "@/domain/taxonomy";
import { chatGptProjectName } from "@/domain/chatgpt-export";
import type { SourceMetadata } from "@/domain/context";
import type { SourceMessageRecord } from "@/repositories/context-repository";

import { deleteSourceAction } from "../actions";

const markdownComponents: Components = {
  a: ({ node: _node, href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-primary hover:underline"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ node: _node, className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    return isBlock ? (
      <code className={className} {...props}>
        {children}
      </code>
    ) : (
      <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[0.85em]" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ node: _node, children, ...props }) => (
    <pre
      className="overflow-x-auto rounded-md border border-border bg-surface-muted p-3 font-mono text-xs leading-6"
      {...props}
    >
      {children}
    </pre>
  ),
  ul: ({ node: _node, children, ...props }) => (
    <ul className="list-disc pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ node: _node, children, ...props }) => (
    <ol className="list-decimal pl-5" {...props}>
      {children}
    </ol>
  ),
  blockquote: ({ node: _node, children, ...props }) => (
    <blockquote className="border-l-2 border-border pl-3 text-muted-foreground" {...props}>
      {children}
    </blockquote>
  )
};

function ConversationTranscript({ messages }: { messages: SourceMessageRecord[] }) {
  if (!messages.length) {
    return <p className="text-sm text-muted-foreground">No messages.</p>;
  }

  return (
    <div className="grid gap-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`grid gap-1.5 rounded-md border border-border bg-surface p-3 ${
            message.role === "user" ? "border-l-4 border-l-primary/50" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <Badge tone={message.role === "user" ? "blue" : "neutral"}>{labelize(message.role)}</Badge>
            {message.occurredAt && <span>{formatDateTime(message.occurredAt)}</span>}
          </div>
          <div className="grid gap-2 text-sm leading-7 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.text}
            </Markdown>
          </div>
        </div>
      ))}
    </div>
  );
}

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
    case "conversation":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetadataField label="Provider" value={conversationProviderLabels[metadata.provider]} />
          <MetadataField label="Model" value={metadata.model} />
          <MetadataField label="Messages" value={metadata.messageCount} />
          <MetadataField label="Started" value={formatDateTime(new Date(metadata.createdAt))} />
          <MetadataField
            label="ChatGPT project"
            value={metadata.projectId ? (chatGptProjectName(metadata.projectId) ?? "Unknown project") : undefined}
          />
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
        <DetailHeader
          badges={
            <>
              <Badge tone="blue">{typeDetail.label}</Badge>
              <Badge tone={source.status === "archived" ? "neutral" : "teal"}>{labelize(source.status)}</Badge>
              <Badge tone={source.privacyLevel === "sensitive" ? "amber" : "neutral"}>
                {labelize(source.privacyLevel)}
              </Badge>
            </>
          }
          title={source.title}
          description={source.description}
          actions={
            <>
              <ButtonLink href={`/sources/${source.id}/edit`} variant="primary" className="w-full sm:w-auto">
                Edit
              </ButtonLink>
              <DeleteForm
                action={deleteSourceAction.bind(null, source.id)}
                title="Delete source"
                message="This permanently deletes the source. This cannot be undone."
                triggerLabel="Delete"
                triggerClassName="w-full sm:w-auto"
              />
            </>
          }
        />

        {source.type === "conversation" && (
          <Alert tone="info" title="Imported transcript">
            Content is read-only. Promote a worthwhile insight to an Entry instead of editing it here. Status,
            themes, and references can still be edited.
          </Alert>
        )}

        <Panel pad="sm">
          <PanelTitle>{typeDetail.label} details</PanelTitle>
          <SourceMetadataSection metadata={source.metadata} />
        </Panel>

        {source.metadata.type === "conversation" ? (
          <section className="grid gap-4">
            <h2 className="text-sm font-semibold">Transcript</h2>
            <ConversationTranscript messages={source.messages} />
          </section>
        ) : (
          source.body && (
            <Panel pad="sm">
              <PanelTitle>Body</PanelTitle>
              <div className="reading whitespace-pre-wrap">{source.body}</div>
            </Panel>
          )
        )}

        {source.references.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-sm font-semibold">References</h2>
            <div className="grid gap-2">
              {source.references.map((ref) => (
                <Panel key={ref.id} as="div" pad="none" className="px-3 py-2 text-sm">
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
                </Panel>
              ))}
            </div>
          </section>
        )}

        {source.themes.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-sm font-semibold">Themes</h2>
            <div className="flex flex-wrap gap-2">
              {source.themes.map((theme) => (
                <Link
                  key={theme.id}
                  href={`/themes/${theme.slug}`}
                  className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border bg-surface px-3 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {theme.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {source.excerpts.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-sm font-semibold">Excerpts</h2>
            <div className="grid gap-3">
              {source.excerpts.map((excerpt) => (
                <Panel key={excerpt.id} as="div" pad="none" className="p-3">
                  <blockquote className="border-l-2 border-border pl-3 font-serif text-sm italic leading-6 text-muted-foreground">
                    &ldquo;{excerpt.text}&rdquo;
                  </blockquote>
                  {excerpt.note && <p className="mt-2 text-sm leading-6">{excerpt.note}</p>}
                  {excerpt.entries.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {excerpt.entries.map((entry) => (
                        <Link
                          key={entry.id}
                          href={`/entries/${entry.id}`}
                          className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-surface-muted px-2 text-xs transition-colors duration-150 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          {entry.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </Panel>
              ))}
            </div>
          </section>
        )}

        {source.entries.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-sm font-semibold">Linked entries</h2>
            <div className="grid gap-1">
              {source.entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/entries/${entry.id}`}
                  className="rounded-md px-2 py-2 text-sm cursor-pointer transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
