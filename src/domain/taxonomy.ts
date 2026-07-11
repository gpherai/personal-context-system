import type { EntryType, QuestionStatus, SourceType } from "./context";

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

export const sourceTypeDetails = {
  video: {
    label: "Video",
    description: "Satsang, lecture, tutorial, or other video recording."
  },
  book: {
    label: "Book",
    description: "Written work: book, e-book, or manuscript."
  },
  post: {
    label: "Post",
    description: "Article, blog post, or online publication."
  },
  image: {
    label: "Image",
    description: "Photo, drawing, or other visual source."
  },
  conversation: {
    label: "Conversation",
    description: "Imported AI chat transcript (ChatGPT, Claude, Gemini)."
  }
} satisfies Record<SourceType, TaxonomyDetail>;
