-- CreateTable
CREATE TABLE "SourceExcerpt" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "messageId" TEXT,
    "text" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceExcerpt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryExcerpt" (
    "entryId" TEXT NOT NULL,
    "excerptId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryExcerpt_pkey" PRIMARY KEY ("entryId","excerptId")
);

-- CreateIndex
CREATE INDEX "SourceExcerpt_sourceId_idx" ON "SourceExcerpt"("sourceId");

-- CreateIndex
CREATE INDEX "SourceExcerpt_messageId_idx" ON "SourceExcerpt"("messageId");

-- CreateIndex
CREATE INDEX "EntryExcerpt_excerptId_idx" ON "EntryExcerpt"("excerptId");

-- AddForeignKey
ALTER TABLE "SourceExcerpt" ADD CONSTRAINT "SourceExcerpt_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceExcerpt" ADD CONSTRAINT "SourceExcerpt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SourceMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryExcerpt" ADD CONSTRAINT "EntryExcerpt_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryExcerpt" ADD CONSTRAINT "EntryExcerpt_excerptId_fkey" FOREIGN KEY ("excerptId") REFERENCES "SourceExcerpt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
