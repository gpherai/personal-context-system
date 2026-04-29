import type {
  CreateEntryCommand,
  EntryStatus,
  EntryType,
  ListEntriesQuery,
  PrivacyLevel,
  QuestionStatus
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
}

export interface NamedRecordContext extends NamedRecord {
  entries: EntryRecord[];
}

export interface QuestionContext extends QuestionRecord {
  entries: EntryRecord[];
}

export interface ContextRepository {
  createEntry(command: CreateEntryCommand): Promise<EntryRecord>;
  listEntries(query?: Partial<ListEntriesQuery>): Promise<EntryRecord[]>;
  getEntry(id: string): Promise<EntryRecord | null>;
  getThemeBySlug(slug: string): Promise<NamedRecordContext | null>;
  getProjectBySlug(slug: string): Promise<NamedRecordContext | null>;
  getQuestion(id: string): Promise<QuestionContext | null>;
  getDashboardOverview(): Promise<DashboardOverview>;
  getContextMirrorSnapshot(): Promise<ContextMirrorSnapshot>;
}
