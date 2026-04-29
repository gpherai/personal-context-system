import { notFound } from "next/navigation";

import { isRecoverableReadError } from "@/application/errors";
import { getProjectBySlug } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";

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
          <Badge tone="blue">Project</Badge>
          <h1 className="mt-3 text-3xl font-semibold">{project.name}</h1>
          {project.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>}
        </header>
        <EntryList entries={project.entries} />
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
