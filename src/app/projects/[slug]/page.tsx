import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
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
          <Link
            href="/cabinet"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            ← Cabinet
          </Link>
          <div className="mt-3">
            <Badge tone="blue">Project</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>}
        </header>
        <EntryList entries={project.entries} />
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
