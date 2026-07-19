import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getProjectBySlug } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, DetailHeader, Panel, PanelTitle } from "@/components/ui";
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
      <div className="mx-auto grid max-w-4xl gap-6">
        <DetailHeader
          backHref="/cabinet"
          backLabel="Cabinet"
          badges={
            <>
              <Badge tone="blue">Project</Badge>
              {project.status === "archived" && <Badge tone="amber">Archived</Badge>}
            </>
          }
          title={project.name}
          description={project.description}
          actions={
            project.entries.length === 0 ? (
              <DeleteForm
                action={deleteProjectAction.bind(null, project.id)}
                title="Delete project"
                message={`Permanently delete the project "${project.name}"? This cannot be undone.`}
                triggerLabel="Delete"
              />
            ) : undefined
          }
        />
        <EntryList entries={project.entries} />

        <section className="grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelTitle>Name and description</PanelTitle>
            <RenameProjectForm
              projectId={project.id}
              name={project.name}
              description={project.description}
              status={project.status ?? "active"}
            />
          </Panel>
          <Panel>
            <PanelTitle>Status</PanelTitle>
            <p className="mb-3 text-sm text-muted-foreground">
              An archived project disappears from active overviews but stays reachable via this page.
            </p>
            <ArchiveProjectForm
              projectId={project.id}
              name={project.name}
              description={project.description}
              status={project.status ?? "active"}
            />
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
