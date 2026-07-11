import { getDashboardOverview } from "@/application/query-service";
import type { DashboardOverview } from "@/repositories/context-repository";

import { apiOk, withApiErrors } from "../_lib";

export const dynamic = "force-dynamic";

type DashboardDto = {
  recentEntries: { id: string; type: string; status: string; title: string; privacyLevel: string; capturedAt: Date }[];
  openQuestions: { id: string; prompt: string; status: string; summary?: string }[];
  activeThemes: { id: string; slug: string; name: string }[];
  activeProjects: { id: string; slug: string; name: string }[];
  counts: DashboardOverview["counts"];
};

// Privacy boundary: this endpoint only exposes shareable material.
// Entries and questions carry a privacyLevel and are filtered to "shareable";
// themes/projects have no privacy dimension in the schema, so they pass through.
function toDto(overview: DashboardOverview): DashboardDto {
  return {
    recentEntries: overview.recentEntries
      .filter(({ privacyLevel }) => privacyLevel === "shareable")
      .map(({ id, type, status, title, privacyLevel, capturedAt }) => ({
        id, type, status, title, privacyLevel, capturedAt
      })),
    openQuestions: overview.openQuestions
      .filter(({ privacyLevel }) => privacyLevel === "shareable")
      .map(({ id, prompt, status, summary }) => ({
        id, prompt, status, summary
      })),
    activeThemes: overview.activeThemes.map(({ id, slug, name }) => ({ id, slug, name })),
    activeProjects: overview.activeProjects.map(({ id, slug, name }) => ({ id, slug, name })),
    counts: overview.counts
  };
}

export async function GET() {
  return withApiErrors(async () => {
    const overview = await getDashboardOverview();
    return apiOk(toDto(overview));
  });
}
