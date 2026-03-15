-- CreateTable
CREATE TABLE "interview_invites" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorEmail" TEXT NOT NULL DEFAULT '',
    "vendorName" TEXT NOT NULL DEFAULT '',
    "candidateEmail" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL DEFAULT '',
    "jobId" TEXT NOT NULL DEFAULT '',
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "meetLink" TEXT NOT NULL DEFAULT '',
    "proposedAt" TIMESTAMP(3),
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "respondedAt" TIMESTAMP(3),
    "candidateNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_invites_vendorId_createdAt_idx" ON "interview_invites"("vendorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "interview_invites_candidateEmail_createdAt_idx" ON "interview_invites"("candidateEmail", "createdAt" DESC);
