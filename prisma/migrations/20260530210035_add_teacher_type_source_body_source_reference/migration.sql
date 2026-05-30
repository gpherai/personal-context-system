-- AlterEnum
ALTER TYPE "SourceType" ADD VALUE 'teacher';

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "body" TEXT;

-- CreateTable
CREATE TABLE "SourceReference" (
    "sourceId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceReference_pkey" PRIMARY KEY ("sourceId","referenceId")
);

-- CreateIndex
CREATE INDEX "SourceReference_referenceId_idx" ON "SourceReference"("referenceId");

-- AddForeignKey
ALTER TABLE "SourceReference" ADD CONSTRAINT "SourceReference_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceReference" ADD CONSTRAINT "SourceReference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
