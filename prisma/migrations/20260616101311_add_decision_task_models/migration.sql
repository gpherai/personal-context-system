-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('proposed', 'accepted', 'deferred', 'follow_up_planned', 'closed');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('open', 'in_progress', 'done', 'cancelled');

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "decisionText" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'proposed',
    "decidedAt" TIMESTAMPTZ(6),
    "supersedesDecisionId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT,
    "questionId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMPTZ(6),
    "nextAction" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Decision_supersedesDecisionId_key" ON "Decision"("supersedesDecisionId");

-- CreateIndex
CREATE INDEX "Decision_questionId_idx" ON "Decision"("questionId");

-- CreateIndex
CREATE INDEX "Decision_status_idx" ON "Decision"("status");

-- CreateIndex
CREATE INDEX "Task_decisionId_idx" ON "Task"("decisionId");

-- CreateIndex
CREATE INDEX "Task_questionId_idx" ON "Task"("questionId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_supersedesDecisionId_fkey" FOREIGN KEY ("supersedesDecisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
