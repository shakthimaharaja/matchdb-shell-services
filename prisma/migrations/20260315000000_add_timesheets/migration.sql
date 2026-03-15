-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL DEFAULT '',
    "candidateName" TEXT NOT NULL DEFAULT '',
    "marketerId" TEXT NOT NULL DEFAULT '',
    "marketerEmail" TEXT NOT NULL DEFAULT '',
    "companyId" TEXT NOT NULL DEFAULT '',
    "companyName" TEXT NOT NULL DEFAULT '',
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "entries" JSONB NOT NULL,
    "totalHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approverNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "timesheets_candidateId_weekStart_key" ON "timesheets"("candidateId", "weekStart");

-- CreateIndex
CREATE INDEX "timesheets_marketerId_status_idx" ON "timesheets"("marketerId", "status");

-- CreateIndex
CREATE INDEX "timesheets_candidateId_weekStart_idx" ON "timesheets"("candidateId", "weekStart" DESC);
