-- CreateTable
CREATE TABLE "SourceMessage" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" VARCHAR(80),
    "position" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "text" TEXT NOT NULL,
    "model" VARCHAR(120),
    "occurredAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceMessage_sourceId_idx" ON "SourceMessage"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceMessage_sourceId_position_key" ON "SourceMessage"("sourceId", "position");

-- AddForeignKey
ALTER TABLE "SourceMessage" ADD CONSTRAINT "SourceMessage_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
