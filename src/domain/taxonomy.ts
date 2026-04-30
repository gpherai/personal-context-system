import type { EntryType, QuestionStatus } from "./context";

export interface TaxonomyDetail {
  label: string;
  description: string;
}

export const entryTypeDetails = {
  observation: {
    label: "Observation",
    description: "Something noticed or recorded without turning it into a claim yet."
  },
  question: {
    label: "Question",
    description: "A captured question that creates and links a tracked Question workflow."
  },
  insight: {
    label: "Insight",
    description: "A stronger synthesis, lesson, or pattern that seems worth preserving."
  },
  suspicion: {
    label: "Suspicion",
    description: "A weak hypothesis or hunch that needs more evidence before becoming an insight."
  },
  reflection: {
    label: "Reflection",
    description: "Personal interpretation, meaning, or retrospective thinking."
  },
  open_loop: {
    label: "Open loop",
    description: "An unresolved thought or action that needs closure but is not yet a tracked Question."
  },
  decision: {
    label: "Decision",
    description: "A choice that should remain findable with its context and reasoning."
  },
  project_note: {
    label: "Project note",
    description: "A note tied to ongoing project context, progress, or direction."
  },
  media_note: {
    label: "Media note",
    description: "A note about a book, article, video, game, repository, or other media object."
  },
  event_reflection: {
    label: "Event reflection",
    description: "A reflection tied to a conversation, session, meeting, or lived event."
  },
  practice_note: {
    label: "Practice note",
    description: "A note from study, sadhana, learning practice, or repeated personal work."
  },
  ai_conversation_note: {
    label: "AI conversation note",
    description: "A durable note distilled from an AI conversation, with the source tool named separately."
  }
} satisfies Record<EntryType, TaxonomyDetail>;

export const questionStatusDetails = {
  open: {
    label: "Open",
    description: "Captured and worth tracking, but not currently being worked."
  },
  active: {
    label: "Active",
    description: "Currently being investigated, answered, or used to drive work."
  },
  parked: {
    label: "Parked",
    description: "Still valid, intentionally deferred until later."
  },
  answered: {
    label: "Answered",
    description: "Resolved enough that it can serve as settled context."
  },
  reframed: {
    label: "Reframed",
    description: "Superseded by a better question or a clearer framing."
  },
  abandoned: {
    label: "Abandoned",
    description: "No longer useful enough to keep active."
  }
} satisfies Record<QuestionStatus, TaxonomyDetail>;
