import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

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
