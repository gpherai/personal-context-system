-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'private';

-- CreateIndex
CREATE INDEX "Question_privacyLevel_idx" ON "Question"("privacyLevel");
