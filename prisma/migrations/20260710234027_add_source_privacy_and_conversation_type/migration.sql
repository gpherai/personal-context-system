-- AlterEnum
ALTER TYPE "SourceType" ADD VALUE 'conversation';

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'private';

-- CreateIndex
CREATE INDEX "Source_privacyLevel_idx" ON "Source"("privacyLevel");
