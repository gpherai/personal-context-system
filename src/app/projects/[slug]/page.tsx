import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getProjectBySlug } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { deleteProjectAction } from "./actions";
import { ArchiveProjectForm, RenameProjectForm } from "./project-forms";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const project = await getProjectBySlug(slug);

    if (!project) {
      notFound();
    }

    return (
      <div className="mx-auto grid max-w-4xl gap-5">
        <header className="border-b border-border pb-5">
          <div className="flex items-start justify-between gap-4">
            <Link
              href="/cabinet"
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              ← Cabinet
            </Link>
            {project.entries.length === 0 && (
              <DeleteForm
                action={deleteProjectAction.bind(null, project.id)}
                title="Delete project"
                message={`Permanently delete the project "${project.name}"? This cannot be undone.`}
                triggerLabel="Delete"
              />
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Badge tone="blue">Project</Badge>
            {project.status === "archived" && <Badge tone="amber">Archived</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>}
        </header>
        <EntryList entries={project.entries} />

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Name and description</h2>
            <RenameProjectForm
              projectId={project.id}
              name={project.name}
              description={project.description}
              status={project.status ?? "active"}
            />
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Status</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              An archived project disappears from active overviews but stays reachable via this page.
            </p>
            <ArchiveProjectForm
              projectId={project.id}
              name={project.name}
              description={project.description}
              status={project.status ?? "active"}
            />
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
