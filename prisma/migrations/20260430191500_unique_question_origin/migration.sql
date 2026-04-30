DROP INDEX IF EXISTS "Question_originEntryId_idx";

CREATE UNIQUE INDEX "Question_originEntryId_key" ON "Question"("originEntryId");
