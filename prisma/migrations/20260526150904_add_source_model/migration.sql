-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('video', 'book', 'post', 'image', 'sadhana', 'upadesha', 'stotra', 'deity_concept');

-- AlterEnum
ALTER TYPE "ObjectType" ADD VALUE 'source';

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "title" VARCHAR(320) NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "searchText" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceTheme" (
    "sourceId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceTheme_pkey" PRIMARY KEY ("sourceId","themeId")
);

-- CreateTable
CREATE TABLE "EntrySource" (
    "entryId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrySource_pkey" PRIMARY KEY ("entryId","sourceId")
);

-- CreateIndex
CREATE INDEX "Source_type_idx" ON "Source"("type");

-- CreateIndex
CREATE INDEX "Source_status_idx" ON "Source"("status");

-- CreateIndex
CREATE INDEX "SourceTheme_themeId_idx" ON "SourceTheme"("themeId");

-- CreateIndex
CREATE INDEX "EntrySource_sourceId_idx" ON "EntrySource"("sourceId");

-- AddForeignKey
ALTER TABLE "SourceTheme" ADD CONSTRAINT "SourceTheme_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceTheme" ADD CONSTRAINT "SourceTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrySource" ADD CONSTRAINT "EntrySource_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrySource" ADD CONSTRAINT "EntrySource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
