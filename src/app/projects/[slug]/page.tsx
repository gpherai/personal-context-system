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
      <div className="mx-auto grid max-w-5xl gap-5">
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
                confirmMessage={`Project "${project.name}" permanent verwijderen?`}
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
          <div className="mt-3 flex gap-2">
            <Badge tone="blue">Project</Badge>
            {project.status === "archived" && <Badge tone="amber">Gearchiveerd</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>}
        </header>
        <EntryList entries={project.entries} />

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Naam en beschrijving</h2>
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
              Een gearchiveerd project verdwijnt uit actieve overzichten, maar blijft bereikbaar via deze pagina.
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
