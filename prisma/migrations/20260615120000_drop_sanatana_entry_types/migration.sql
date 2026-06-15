-- Migrate existing entries with Sanatana-specific types → observation
UPDATE "Entry" SET "type" = 'observation'
WHERE "type" IN ('project_note', 'media_note', 'event_reflection', 'practice_note', 'ai_conversation_note');

-- Replace EntryType enum (PostgreSQL requires rename+recreate to remove values)
ALTER TYPE "EntryType" RENAME TO "EntryType_old";
CREATE TYPE "EntryType" AS ENUM ('observation', 'question', 'insight', 'suspicion', 'reflection', 'open_loop', 'decision');
ALTER TABLE "Entry" ALTER COLUMN "type" TYPE "EntryType" USING "type"::text::"EntryType";
DROP TYPE "EntryType_old";
