-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('observation', 'question', 'insight', 'suspicion', 'reflection', 'open_loop', 'decision', 'project_note', 'media_note', 'event_reflection', 'practice_note', 'ai_conversation_note');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('active', 'archived', 'draft');

-- CreateEnum
CREATE TYPE "PrivacyLevel" AS ENUM ('private', 'sensitive', 'shareable');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('open', 'active', 'parked', 'answered', 'reframed', 'abandoned');

-- CreateEnum
CREATE TYPE "ObjectType" AS ENUM ('entry', 'theme', 'project', 'question', 'thread', 'reference', 'attachment');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('relates_to', 'mentions', 'expands', 'contradicts', 'supports', 'questions', 'answers', 'reframes', 'part_of', 'inspired_by', 'external_reference');

-- CreateEnum
CREATE TYPE "ReferenceKind" AS ENUM ('url', 'book', 'article', 'film', 'game', 'repository', 'external_record', 'other');

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'active',
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "source" VARCHAR(240),
    "confidence" DOUBLE PRECISION,
    "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'private',
    "occurredAt" TIMESTAMPTZ(6),
    "capturedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "parentThemeId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'open',
    "summary" TEXT,
    "originEntryId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL,
    "kind" "ReferenceKind" NOT NULL DEFAULT 'url',
    "title" VARCHAR(220) NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mediaType" VARCHAR(160),
    "checksum" VARCHAR(128),
    "sizeBytes" BIGINT,
    "title" VARCHAR(220),
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "fromType" "ObjectType" NOT NULL,
    "fromId" TEXT NOT NULL,
    "toType" "ObjectType" NOT NULL,
    "toId" TEXT NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryTheme" (
    "entryId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryTheme_pkey" PRIMARY KEY ("entryId","themeId")
);

-- CreateTable
CREATE TABLE "EntryProject" (
    "entryId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryProject_pkey" PRIMARY KEY ("entryId","projectId")
);

-- CreateTable
CREATE TABLE "EntryQuestion" (
    "entryId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryQuestion_pkey" PRIMARY KEY ("entryId","questionId")
);

-- CreateTable
CREATE TABLE "EntryThread" (
    "entryId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryThread_pkey" PRIMARY KEY ("entryId","threadId")
);

-- CreateTable
CREATE TABLE "EntryReference" (
    "entryId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryReference_pkey" PRIMARY KEY ("entryId","referenceId")
);

-- CreateTable
CREATE TABLE "EntryAttachment" (
    "entryId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryAttachment_pkey" PRIMARY KEY ("entryId","attachmentId")
);

-- CreateIndex
CREATE INDEX "Entry_type_idx" ON "Entry"("type");

-- CreateIndex
CREATE INDEX "Entry_status_idx" ON "Entry"("status");

-- CreateIndex
CREATE INDEX "Entry_privacyLevel_idx" ON "Entry"("privacyLevel");

-- CreateIndex
CREATE INDEX "Entry_capturedAt_idx" ON "Entry"("capturedAt");

-- CreateIndex
CREATE INDEX "Entry_occurredAt_idx" ON "Entry"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE INDEX "Theme_status_idx" ON "Theme"("status");

-- CreateIndex
CREATE INDEX "Theme_parentThemeId_idx" ON "Theme"("parentThemeId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "Question_originEntryId_idx" ON "Question"("originEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "Thread_slug_key" ON "Thread"("slug");

-- CreateIndex
CREATE INDEX "Thread_status_idx" ON "Thread"("status");

-- CreateIndex
CREATE INDEX "Reference_kind_idx" ON "Reference"("kind");

-- CreateIndex
CREATE INDEX "Attachment_checksum_idx" ON "Attachment"("checksum");

-- CreateIndex
CREATE INDEX "Relationship_fromType_fromId_idx" ON "Relationship"("fromType", "fromId");

-- CreateIndex
CREATE INDEX "Relationship_toType_toId_idx" ON "Relationship"("toType", "toId");

-- CreateIndex
CREATE INDEX "Relationship_relationType_idx" ON "Relationship"("relationType");

-- CreateIndex
CREATE INDEX "EntryTheme_themeId_idx" ON "EntryTheme"("themeId");

-- CreateIndex
CREATE INDEX "EntryProject_projectId_idx" ON "EntryProject"("projectId");

-- CreateIndex
CREATE INDEX "EntryQuestion_questionId_idx" ON "EntryQuestion"("questionId");

-- CreateIndex
CREATE INDEX "EntryThread_threadId_idx" ON "EntryThread"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "EntryThread_threadId_position_key" ON "EntryThread"("threadId", "position");

-- CreateIndex
CREATE INDEX "EntryReference_referenceId_idx" ON "EntryReference"("referenceId");

-- CreateIndex
CREATE INDEX "EntryAttachment_attachmentId_idx" ON "EntryAttachment"("attachmentId");

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_parentThemeId_fkey" FOREIGN KEY ("parentThemeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_originEntryId_fkey" FOREIGN KEY ("originEntryId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryTheme" ADD CONSTRAINT "EntryTheme_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryTheme" ADD CONSTRAINT "EntryTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryProject" ADD CONSTRAINT "EntryProject_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryProject" ADD CONSTRAINT "EntryProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryQuestion" ADD CONSTRAINT "EntryQuestion_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryQuestion" ADD CONSTRAINT "EntryQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryThread" ADD CONSTRAINT "EntryThread_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryThread" ADD CONSTRAINT "EntryThread_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryReference" ADD CONSTRAINT "EntryReference_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryReference" ADD CONSTRAINT "EntryReference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryAttachment" ADD CONSTRAINT "EntryAttachment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryAttachment" ADD CONSTRAINT "EntryAttachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
