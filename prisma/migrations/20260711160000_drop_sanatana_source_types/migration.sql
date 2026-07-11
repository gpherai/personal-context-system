-- No existing rows use the Sanatana-specific source types (verified 2026-07-11: 0 rows),
-- so no data migration UPDATE is needed before narrowing the enum.

-- Replace SourceType enum (PostgreSQL requires rename+recreate to remove values)
ALTER TYPE "SourceType" RENAME TO "SourceType_old";
CREATE TYPE "SourceType" AS ENUM ('video', 'book', 'post', 'image', 'conversation');
ALTER TABLE "Source" ALTER COLUMN "type" TYPE "SourceType" USING "type"::text::"SourceType";
DROP TYPE "SourceType_old";
