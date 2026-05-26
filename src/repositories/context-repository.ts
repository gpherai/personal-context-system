import type {
  CreateAttachmentCommand,
  CreateEntryCommand,
  CreateReferenceCommand,
  CreateSavedFilterCommand,
  CreateSourceCommand,
  CreateThreadCommand,
  EntryStatus,
  EntryType,
  ListEntriesQuery,
  ListSourcesQuery,
  LinkObjectsCommand,
  PrivacyLevel,
  PromoteEntryToQuestionCommand,
  QuestionStatus,
  RecordStatus,
  ReferenceKind,
  RelationType,
  ObjectType,
  SavedFilterParams,
  SourceMetadata,
  SourceType,
  UpdateEntryCommand,
  UpdateQuestionCommand,
  UpdateSourceCommand
} from "@/domain/context";

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
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceSummary {
  id: string;
  type: SourceType;
  title: string;
  description?: string;
  status: RecordStatus;
  metadata: SourceMetadata;
  themes: LinkedName[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceRecord extends SourceSummary {
  entries: { id: string; title: string }[];
}

export interface RelationshipRecord {
  id: string;
  fromType: ObjectType;
  fromId: string;
  toType: ObjectType;
  toId: string;
  relationType: RelationType;
  note?: string;
  createdAt: Date;
}

export type RelationshipTargetType = ObjectType;

export interface RelationshipTarget {
  objectType: RelationshipTargetType;
  objectId: string;
  label: string;
  detail?: string;
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

export interface EntryRecord {
  id: string;
  type: EntryType;
  status: EntryStatus;
  title: string;
  body: string;
  summary?: string;
  source?: string;
  confidence?: number;
  privacyLevel: PrivacyLevel;
  occurredAt?: Date;
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
  themes: LinkedName[];
  projects: LinkedName[];
  questions: LinkedQuestion[];
  threads: LinkedThread[];
  references: ReferenceRecord[];
  attachments: AttachmentRecord[];
  sources: { id: string; type: SourceType; title: string }[];
  outgoingRelationships: RelationshipRecord[];
  incomingRelationships: RelationshipRecord[];
}

export interface QuestionRecord {
  id: string;
  prompt: string;
  status: QuestionStatus;
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
  count?: number;
  metadata?: Record<string, unknown>;
}

export interface DashboardOverview {
  recentEntries: EntryRecord[];
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
  archivedEntries: EntryRecord[];
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
  sources: SourceSummary[];
}

export interface NamedRecordContext extends NamedRecord {
  entries: EntryRecord[];
}

export interface QuestionContext extends QuestionRecord {
  entries: EntryRecord[];
  outgoingRelationships: RelationshipRecord[];
  incomingRelationships: RelationshipRecord[];
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
  entries: EntryRecord[];
  themes: NamedRecord[];
  projects: NamedRecord[];
  questions: QuestionRecord[];
  threads: Omit<ThreadRecord, "entries">[];
  relationships: RelationshipRecord[];
  sources: SourceSummary[];
}

export interface ContextRepository {
  createEntry(command: CreateEntryCommand): Promise<EntryRecord>;
  updateEntry(command: UpdateEntryCommand): Promise<EntryRecord>;
  listEntries(query?: Partial<ListEntriesQuery>): Promise<EntryRecord[]>;
  getEntry(id: string): Promise<EntryRecord | null>;
  getThemeBySlug(slug: string): Promise<NamedRecordContext | null>;
  getProjectBySlug(slug: string): Promise<NamedRecordContext | null>;
  getQuestion(id: string): Promise<QuestionContext | null>;
  listRelationshipTargets(): Promise<RelationshipTarget[]>;
  createSavedFilter(command: CreateSavedFilterCommand): Promise<SavedFilterRecord>;
  listSavedFilters(): Promise<SavedFilterRecord[]>;
  updateQuestion(command: UpdateQuestionCommand): Promise<QuestionRecord>;
  promoteEntryToQuestion(command: PromoteEntryToQuestionCommand): Promise<QuestionRecord>;
  linkObjects(command: LinkObjectsCommand): Promise<RelationshipRecord>;
  createReference(command: CreateReferenceCommand): Promise<ReferenceRecord>;
  createAttachment(command: CreateAttachmentCommand): Promise<AttachmentRecord>;
  createThread(command: CreateThreadCommand): Promise<ThreadRecord>;
  listThreads(): Promise<Omit<ThreadRecord, "entries">[]>;
  getThreadBySlug(slug: string): Promise<ThreadRecord | null>;
  getGraphSnapshot(): Promise<GraphSnapshot>;
  getDashboardOverview(): Promise<DashboardOverview>;
  getCabinetOverview(): Promise<CabinetOverview>;
  getContextMirrorSnapshot(): Promise<ContextMirrorSnapshot>;
  createSource(command: CreateSourceCommand): Promise<SourceRecord>;
  updateSource(command: UpdateSourceCommand): Promise<SourceRecord>;
  deleteSource(id: string): Promise<void>;
  listSources(query?: Partial<ListSourcesQuery>): Promise<SourceSummary[]>;
  getSource(id: string): Promise<SourceRecord | null>;
  linkEntryToSource(entryId: string, sourceId: string): Promise<void>;
  unlinkEntryFromSource(entryId: string, sourceId: string): Promise<void>;
  linkSourceToTheme(sourceId: string, themeId: string): Promise<void>;
  unlinkSourceFromTheme(sourceId: string, themeId: string): Promise<void>;
  setThemeParent(themeId: string, parentThemeId: string | null): Promise<void>;
  listThemes(): Promise<NamedRecord[]>;
}
