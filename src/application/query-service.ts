import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { getPrismaClient } from "@/infrastructure/database/client";

export async function getDashboardOverview() {
  return createPrismaContextRepository().getDashboardOverview();
}

export async function getCabinetOverview() {
  return createPrismaContextRepository().getCabinetOverview();
}

export async function getEntryById(id: string) {
  return createPrismaContextRepository().getEntry(id);
}

export async function getThemeBySlug(slug: string) {
  return createPrismaContextRepository().getThemeBySlug(slug);
}

export async function getProjectBySlug(slug: string) {
  return createPrismaContextRepository().getProjectBySlug(slug);
}

export async function getQuestionById(id: string) {
  return createPrismaContextRepository().getQuestion(id);
}

export async function getRelationshipTargets() {
  return createPrismaContextRepository().listRelationshipTargets();
}

export async function getSavedFilters() {
  return createPrismaContextRepository().listSavedFilters();
}

export async function getThreads() {
  return createPrismaContextRepository().listThreads();
}

export async function getThreadBySlug(slug: string) {
  return createPrismaContextRepository().getThreadBySlug(slug);
}

export async function getGraphSnapshot() {
  return createPrismaContextRepository().getGraphSnapshot();
}

export async function getLedgerEntries(params?: URLSearchParams) {
  const { listEntries } = await import("./context-service");
  return listEntries(createPrismaContextRepository(), params);
}

export async function getContextMirrorSnapshot() {
  return createPrismaContextRepository().getContextMirrorSnapshot();
}

export async function listThemes() {
  return getPrismaClient().theme.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, slug: true, name: true, metadata: true, parentThemeId: true }
  });
}

export async function getSourceById(id: string) {
  return createPrismaContextRepository().getSource(id);
}

export async function getSourcesByTheme(themeId: string) {
  return createPrismaContextRepository().listSources({ themeId, limit: 200 });
}

export async function getSources(params?: URLSearchParams) {
  const { listSources } = await import("./context-service");
  return listSources(createPrismaContextRepository(), params);
}
