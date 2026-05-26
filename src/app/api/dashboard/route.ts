import { isRecoverableReadError } from "@/application/errors";
import { getDashboardOverview } from "@/application/query-service";
import type { DashboardOverview } from "@/repositories/context-repository";

export const dynamic = "force-dynamic";

type DashboardDto = {
  recentEntries: { id: string; type: string; status: string; title: string; privacyLevel: string; capturedAt: Date }[];
  openQuestions: { id: string; prompt: string; status: string; summary?: string }[];
  activeThemes: { id: string; slug: string; name: string }[];
  activeProjects: { id: string; slug: string; name: string }[];
  counts: DashboardOverview["counts"];
};

function toDto(overview: DashboardOverview): DashboardDto {
  return {
    recentEntries: overview.recentEntries.map(({ id, type, status, title, privacyLevel, capturedAt }) => ({
      id, type, status, title, privacyLevel, capturedAt
    })),
    openQuestions: overview.openQuestions.map(({ id, prompt, status, summary }) => ({
      id, prompt, status, summary
    })),
    activeThemes: overview.activeThemes.map(({ id, slug, name }) => ({ id, slug, name })),
    activeProjects: overview.activeProjects.map(({ id, slug, name }) => ({ id, slug, name })),
    counts: overview.counts
  };
}

export async function GET() {
  try {
    const overview = await getDashboardOverview();

    return Response.json(toDto(overview), {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (isRecoverableReadError(error)) {
      return Response.json(
        { error: "The local database is not available." },
        {
          status: 503,
          headers: {
            "cache-control": "no-store",
          },
        }
      );
    }

    throw error;
  }
}
