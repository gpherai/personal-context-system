import { getDashboardHome } from "@/application/query-service";
import type { DashboardHome } from "@/repositories/context-repository";

import { apiError, apiOk, withApiErrors } from "../../_lib";

export const dynamic = "force-dynamic";

type DashboardHomeDto = {
  recentEntries: { id: string; title: string | undefined; type: string; capturedAt: Date; privacyLevel: string }[];
  openQuestions: { id: string; prompt: string; status: string; privacyLevel: string; summary?: string }[];
  activeProjects: { id: string; slug: string; name: string }[];
  counts: { entries: number; openQuestions: number; activeProjects: number };
};

function toDto(home: DashboardHome): DashboardHomeDto {
  return {
    recentEntries: home.recentEntries.map(({ id, title, type, capturedAt, privacyLevel }) => ({
      id,
      title: title ?? undefined,
      type,
      capturedAt,
      privacyLevel
    })),
    openQuestions: home.openQuestions.map(({ id, prompt, status, privacyLevel, summary }) => ({
      id,
      prompt,
      status,
      privacyLevel,
      summary
    })),
    activeProjects: home.activeProjects.map(({ id, slug, name }) => ({ id, slug, name })),
    counts: home.counts
  };
}

export async function GET() {
  return withApiErrors(async () => {
    const home = await getDashboardHome();
    return apiOk(toDto(home));
  });
}
