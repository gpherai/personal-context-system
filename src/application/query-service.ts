import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { getContextMirrorStatus as infraGetContextMirrorStatus } from "@/infrastructure/files/context-mirror-writer";
import type { ContextRepository } from "@/repositories/context-repository";
import { listEntries, listSources } from "./context-service";

function repo(r?: ContextRepository): ContextRepository {
  return r ?? createPrismaContextRepository();
}

export async function getDashboardOverview(repository?: ContextRepository) {
  return repo(repository).getDashboardOverview();
}

export async function getCabinetOverview(repository?: ContextRepository) {
  return repo(repository).getCabinetOverview();
}

export async function getEntryById(id: string, repository?: ContextRepository) {
  return repo(repository).getEntry(id);
}

export async function getThemeBySlug(slug: string, repository?: ContextRepository) {
  return repo(repository).getThemeBySlug(slug);
}

export async function getProjectBySlug(slug: string, repository?: ContextRepository) {
  return repo(repository).getProjectBySlug(slug);
}

export async function getQuestionById(id: string, repository?: ContextRepository) {
  return repo(repository).getQuestion(id);
}

export async function getRelationshipTargets(repository?: ContextRepository) {
  return repo(repository).listRelationshipTargets();
}

export async function getSavedFilters(repository?: ContextRepository) {
  return repo(repository).listSavedFilters();
}

export async function getThreads(repository?: ContextRepository) {
  return repo(repository).listThreads();
}

export async function getThreadBySlug(slug: string, repository?: ContextRepository) {
  return repo(repository).getThreadBySlug(slug);
}

export async function getGraphSnapshot(repository?: ContextRepository) {
  return repo(repository).getGraphSnapshot();
}

export async function getLedgerEntries(params?: URLSearchParams, repository?: ContextRepository) {
  return listEntries(repo(repository), params);
}

export async function getContextMirrorSnapshot(repository?: ContextRepository) {
  return repo(repository).getContextMirrorSnapshot();
}

export async function listThemes(repository?: ContextRepository) {
  return repo(repository).listThemes();
}

export async function getSourceById(id: string, repository?: ContextRepository) {
  return repo(repository).getSource(id);
}

export async function getSourcesByTheme(themeId: string, repository?: ContextRepository) {
  return repo(repository).listSources({ themeId, limit: 200 });
}

export async function getSources(params?: URLSearchParams, repository?: ContextRepository) {
  return listSources(repo(repository), params);
}

export function getContextMirrorStatus() {
  return infraGetContextMirrorStatus();
}
