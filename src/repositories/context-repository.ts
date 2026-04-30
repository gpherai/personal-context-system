import type {
  CreateAttachmentCommand,
  CreateEntryCommand,
  CreateReferenceCommand,
  CreateThreadCommand,
  EntryStatus,
  EntryType,
  ListEntriesQuery,
  LinkObjectsCommand,
  PrivacyLevel,
  QuestionStatus,
  RecordStatus,
  ReferenceKind,
  RelationType,
  ObjectType,
  UpdateEntryCommand,
  UpdateQuestionCommand
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

export type RelationshipTargetType = Extract<ObjectType, "entry" | "theme" | "project" | "question">;

export interface RelationshipTarget {
  objectType: RelationshipTargetType;
  objectId: string;
  label: string;
  detail?: string;
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
  outgoingRelationships: RelationshipRecord[];
  incomingRelationships: RelationshipRecord[];
}

export interface QuestionRecord {
  id: string;
  prompt: string;
  status: QuestionStatus;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NamedRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  count?: number;
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

export interface ContextMirrorSnapshot {
  entries: EntryRecord[];
  openQuestions: QuestionRecord[];
  themes: NamedRecord[];
  projects: NamedRecord[];
  threads: Omit<ThreadRecord, "entries">[];
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
  updateQuestion(command: UpdateQuestionCommand): Promise<QuestionRecord>;
  linkObjects(command: LinkObjectsCommand): Promise<RelationshipRecord>;
  createReference(command: CreateReferenceCommand): Promise<ReferenceRecord>;
  createAttachment(command: CreateAttachmentCommand): Promise<AttachmentRecord>;
  createThread(command: CreateThreadCommand): Promise<ThreadRecord>;
  listThreads(): Promise<Omit<ThreadRecord, "entries">[]>;
  getThreadBySlug(slug: string): Promise<ThreadRecord | null>;
  getGraphSnapshot(): Promise<GraphSnapshot>;
  getDashboardOverview(): Promise<DashboardOverview>;
  getContextMirrorSnapshot(): Promise<ContextMirrorSnapshot>;
}
