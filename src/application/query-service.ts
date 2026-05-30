import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { getContextMirrorStatus as infraGetContextMirrorStatus } from "@/infrastructure/files/context-mirror-writer";
import { isValidId } from "@/lib/format";
import type {
  EntryRepository,
  FilterRepository,
  QuestionRepository,
  RelationshipRepository,
  SnapshotRepository,
  SourceRepository,
  TaxonomyRepository,
  ThreadRepository
} from "@/repositories/context-repository";
import type { SourceType } from "@/domain/context";
import { listEntries, listSources } from "./context-service";

export async function getDashboardOverview(repository?: SnapshotRepository) {
  return (repository ?? createPrismaContextRepository()).getDashboardOverview();
}

export async function getCabinetOverview(repository?: SnapshotRepository) {
  return (repository ?? createPrismaContextRepository()).getCabinetOverview();
}

export async function getEntryById(id: string, repository?: EntryRepository) {
  if (!isValidId(id)) return null;
  return (repository ?? createPrismaContextRepository()).getEntry(id);
}

export async function getThemeBySlug(slug: string, repository?: TaxonomyRepository) {
  return (repository ?? createPrismaContextRepository()).getThemeBySlug(slug);
}

export async function getProjectBySlug(slug: string, repository?: TaxonomyRepository) {
  return (repository ?? createPrismaContextRepository()).getProjectBySlug(slug);
}

export async function getQuestionById(id: string, repository?: QuestionRepository) {
  if (!isValidId(id)) return null;
  return (repository ?? createPrismaContextRepository()).getQuestion(id);
}

export async function getRelationshipTargets(repository?: RelationshipRepository) {
  return (repository ?? createPrismaContextRepository()).listRelationshipTargets();
}

export async function getSavedFilters(repository?: FilterRepository) {
  return (repository ?? createPrismaContextRepository()).listSavedFilters();
}

export async function getThreads(repository?: ThreadRepository) {
  return (repository ?? createPrismaContextRepository()).listThreads();
}

export async function getThreadBySlug(slug: string, repository?: ThreadRepository) {
  return (repository ?? createPrismaContextRepository()).getThreadBySlug(slug);
}

export async function getGraphSnapshot(repository?: SnapshotRepository) {
  return (repository ?? createPrismaContextRepository()).getGraphSnapshot();
}

export async function getLedgerEntries(params?: URLSearchParams, repository?: EntryRepository) {
  return listEntries(repository ?? createPrismaContextRepository(), params);
}

export async function getContextMirrorSnapshot(repository?: SnapshotRepository) {
  return (repository ?? createPrismaContextRepository()).getContextMirrorSnapshot();
}

export async function listThemes(repository?: TaxonomyRepository) {
  return (repository ?? createPrismaContextRepository()).listThemes();
}

export async function getSourceById(id: string, repository?: SourceRepository) {
  if (!isValidId(id)) return null;
  return (repository ?? createPrismaContextRepository()).getSource(id);
}

export async function getSourcesByTheme(themeId: string, repository?: SourceRepository) {
  return (repository ?? createPrismaContextRepository()).listSources({ themeId, limit: 200 });
}

export async function getSources(params?: URLSearchParams, repository?: SourceRepository) {
  return listSources(repository ?? createPrismaContextRepository(), params);
}

export async function getSourcesByType(type: SourceType, repository?: SourceRepository) {
  return (repository ?? createPrismaContextRepository()).listSourcesByType(type);
}

export function getContextMirrorStatus() {
  return infraGetContextMirrorStatus();
}
