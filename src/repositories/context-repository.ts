import type {
  CreateAttachmentCommand,
  CreateEntryCommand,
  CreateQuestionCommand,
  CreateReferenceCommand,
  CreateSavedFilterCommand,
  CreateSourceCommand,
  CreateThreadCommand,
  EntryStatus,
  EntryType,
  ListEntriesQuery,
  ListQuestionsQuery,
  ListSourcesQuery,
  PrivacyLevel,
  PromoteEntryToQuestionCommand,
  QuestionStatus,
  RecordStatus,
  ReferenceKind,
  SavedFilterParams,
  SourceMetadata,
  SourceType,
  UpdateEntryCommand,
  UpdateQuestionCommand,
  UpdateSourceCommand
} from "@/domain/context";

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface LinkedName {
  id: string;
  slug: string;
  name: string;
}

export interface LinkedQuestion {
  id: string;
  prompt: string;
  status: QuestionStatus;
}

export interface LinkedThread {
  id: string;
  slug: string;
  title: string;
}

export interface ReferenceRecord {
  id: string;
  kind: ReferenceKind;
  title: string;
  url?: string;
  description?: string;
  metadata: JsonObject;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentRecord {
  id: string;
  path: string;
  mediaType?: string;
  checksum?: string;
  sizeBytes?: string;
  title?: string;
  description?: string;
  metadata: JsonObject;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceSummary {
  id: string;
  type: SourceType;
  title: string;
  description?: string;
  body?: string;
  status: RecordStatus;
  metadata: SourceMetadata;
  themes: LinkedName[];
  references: ReferenceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceRecord extends SourceSummary {
  entries: { id: string; title: string }[];
}

export interface SavedFilterRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  params: SavedFilterParams;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntryListItem {
  id: string;
  type: EntryType;
  status: EntryStatus;
  title: string;
  body: string;
  summary?: string;
  privacyLevel: PrivacyLevel;
  occurredAt?: Date;
  capturedAt: Date;
  themes: LinkedName[];
  projects: LinkedName[];
}

export interface EntryRecord extends EntryListItem {
  source?: string;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: JsonObject;
  questions: LinkedQuestion[];
  threads: LinkedThread[];
  references: ReferenceRecord[];
  attachments: AttachmentRecord[];
  sources: { id: string; type: SourceType; title: string }[];
}

export interface QuestionRecord {
  id: string;
  prompt: string;
  status: QuestionStatus;
  privacyLevel: PrivacyLevel;
  summary?: string;
  originEntryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NamedRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  entryCount?: number;
  metadata?: JsonObject;
}

export interface DashboardOverview {
  recentEntries: EntryListItem[];
  openQuestions: QuestionRecord[];
  activeThemes: NamedRecord[];
  activeProjects: NamedRecord[];
  counts: {
    entries: number;
    openQuestions: number;
    themes: number;
    projects: number;
  };
}

export interface EntryTypeSummary {
  type: EntryType;
  count: number;
}

export interface EntryStatusSummary {
  status: EntryStatus;
  count: number;
}

export interface SourceTypeSummary {
  type: SourceType;
  count: number;
}

export interface CabinetOverview {
  entryTypes: EntryTypeSummary[];
  entryStatuses: EntryStatusSummary[];
  archivedEntries: EntryListItem[];
  themes: NamedRecord[];
  projects: NamedRecord[];
  questions: QuestionRecord[];
  threads: Omit<ThreadRecord, "entries">[];
  sourceTypes: SourceTypeSummary[];
  sourceCount: number;
}

export interface ContextMirrorSnapshot {
  entries: EntryRecord[];
  openQuestions: QuestionRecord[];
  themes: NamedRecord[];
  projects: NamedRecord[];
  threads: ThreadRecord[];
  sources: SourceRecord[];
}

export interface NamedRecordContext extends NamedRecord {
  entries: EntryRecord[];
}

export interface QuestionContext extends QuestionRecord {
  entries: EntryRecord[];
}

export interface ThreadRecord {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: RecordStatus;
  createdAt: Date;
  updatedAt: Date;
  entries: EntryRecord[];
}

export interface GraphSnapshot {
  entries: EntryListItem[];
  themes: NamedRecord[];
  projects: NamedRecord[];
  questions: QuestionRecord[];
  threads: Omit<ThreadRecord, "entries">[];
  sources: SourceSummary[];
}

export interface EntryRepository {
  createEntry(command: CreateEntryCommand): Promise<EntryRecord>;
  updateEntry(command: UpdateEntryCommand): Promise<EntryRecord>;
  deleteEntry(id: string): Promise<void>;
  listEntries(query?: ListEntriesQuery): Promise<EntryListItem[]>;
  getEntry(id: string): Promise<EntryRecord | null>;
  promoteEntryToQuestion(command: PromoteEntryToQuestionCommand): Promise<QuestionRecord>;
  createReference(command: CreateReferenceCommand): Promise<ReferenceRecord>;
  createAttachment(command: CreateAttachmentCommand): Promise<AttachmentRecord>;
}

export interface SourceRepository {
  createSource(command: CreateSourceCommand): Promise<SourceRecord>;
  updateSource(command: UpdateSourceCommand): Promise<SourceRecord>;
  deleteSource(id: string): Promise<void>;
  listSources(query?: ListSourcesQuery): Promise<SourceSummary[]>;
  listSourcesByType(type: SourceType, limit?: number): Promise<SourceSummary[]>;
  getSource(id: string): Promise<SourceRecord | null>;
  linkEntryToSource(entryId: string, sourceId: string): Promise<void>;
  unlinkEntryFromSource(entryId: string, sourceId: string): Promise<void>;
  linkSourceToTheme(sourceId: string, themeId: string): Promise<void>;
  unlinkSourceFromTheme(sourceId: string, themeId: string): Promise<void>;
  linkSourceToReference(sourceId: string, referenceId: string): Promise<void>;
  unlinkSourceFromReference(sourceId: string, referenceId: string): Promise<void>;
}

export interface QuestionRepository {
  listQuestions(query?: ListQuestionsQuery): Promise<QuestionRecord[]>;
  createQuestion(command: CreateQuestionCommand): Promise<QuestionRecord>;
  getQuestion(id: string): Promise<QuestionContext | null>;
  updateQuestion(command: UpdateQuestionCommand): Promise<QuestionRecord>;
  deleteQuestion(id: string): Promise<void>;
}

export interface TaxonomyRepository {
  getThemeBySlug(slug: string): Promise<NamedRecordContext | null>;
  getProjectBySlug(slug: string): Promise<NamedRecordContext | null>;
  listThemes(): Promise<NamedRecord[]>;
  setThemeParent(themeId: string, parentThemeId: string | null): Promise<void>;
  deleteTheme(id: string): Promise<void>;
  deleteProject(id: string): Promise<void>;
}

export interface ThreadRepository {
  createThread(command: CreateThreadCommand): Promise<ThreadRecord>;
  listThreads(): Promise<Omit<ThreadRecord, "entries">[]>;
  getThreadBySlug(slug: string): Promise<ThreadRecord | null>;
  deleteThread(id: string): Promise<void>;
}

export interface FilterRepository {
  createSavedFilter(command: CreateSavedFilterCommand): Promise<SavedFilterRecord>;
  listSavedFilters(): Promise<SavedFilterRecord[]>;
}

export interface DashboardHome {
  recentEntries: Pick<EntryListItem, "id" | "title" | "type" | "capturedAt" | "privacyLevel">[];
  openQuestions: Pick<QuestionRecord, "id" | "prompt" | "status" | "privacyLevel" | "summary">[];
  activeProjects: NamedRecord[];
  counts: { entries: number; openQuestions: number; activeProjects: number };
}

export interface SnapshotRepository {
  getDashboardOverview(): Promise<DashboardOverview>;
  getDashboardHome(): Promise<DashboardHome>;
  getCabinetOverview(): Promise<CabinetOverview>;
  getGraphSnapshot(): Promise<GraphSnapshot>;
  getContextMirrorSnapshot(): Promise<ContextMirrorSnapshot>;
}

export interface ContextRepository extends
  EntryRepository,
  SourceRepository,
  QuestionRepository,
  TaxonomyRepository,
  ThreadRepository,
  FilterRepository,
  SnapshotRepository {}
