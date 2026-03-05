-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorEmail" TEXT NOT NULL,
    "recruiterName" TEXT NOT NULL DEFAULT '',
    "recruiterPhone" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "jobCountry" TEXT NOT NULL DEFAULT '',
    "jobState" TEXT NOT NULL DEFAULT '',
    "jobCity" TEXT NOT NULL DEFAULT '',
    "jobType" TEXT NOT NULL,
    "jobSubType" TEXT NOT NULL DEFAULT '',
    "workMode" TEXT NOT NULL DEFAULT '',
    "salaryMin" DECIMAL(65,30),
    "salaryMax" DECIMAL(65,30),
    "payPerHour" DECIMAL(65,30),
    "skillsRequired" TEXT[],
    "experienceRequired" INTEGER NOT NULL DEFAULT 0,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "currentCompany" TEXT NOT NULL DEFAULT '',
    "currentRole" TEXT NOT NULL DEFAULT '',
    "preferredJobType" TEXT NOT NULL DEFAULT '',
    "expectedHourlyRate" DECIMAL(65,30),
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "skills" TEXT[],
    "location" TEXT NOT NULL DEFAULT '',
    "profileCountry" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "resumeSummary" TEXT NOT NULL DEFAULT '',
    "resumeExperience" TEXT NOT NULL DEFAULT '',
    "resumeEducation" TEXT NOT NULL DEFAULT '',
    "resumeAchievements" TEXT NOT NULL DEFAULT '',
    "visibilityConfig" JSONB,
    "profileLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "candidateId" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poke_records" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL DEFAULT '',
    "senderEmail" TEXT NOT NULL DEFAULT '',
    "senderType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetVendorId" TEXT,
    "targetEmail" TEXT NOT NULL,
    "targetName" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "isEmail" BOOLEAN NOT NULL DEFAULT false,
    "jobId" TEXT,
    "jobTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poke_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poke_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poke_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "marketerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketer_candidates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL DEFAULT '',
    "candidateName" TEXT NOT NULL DEFAULT '',
    "candidateEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketer_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forwarded_openings" (
    "id" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "marketerEmail" TEXT NOT NULL DEFAULT '',
    "companyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "candidateEmail" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL DEFAULT '',
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "jobLocation" TEXT NOT NULL DEFAULT '',
    "jobType" TEXT NOT NULL DEFAULT '',
    "jobSubType" TEXT NOT NULL DEFAULT '',
    "vendorEmail" TEXT NOT NULL DEFAULT '',
    "skillsRequired" TEXT[],
    "payPerHour" DECIMAL(65,30),
    "salaryMin" DECIMAL(65,30),
    "salaryMax" DECIMAL(65,30),
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forwarded_openings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_vendorId_createdAt_idx" ON "jobs"("vendorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "jobs_isActive_createdAt_idx" ON "jobs"("isActive", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_candidateId_key" ON "candidate_profiles"("candidateId");

-- CreateIndex
CREATE INDEX "candidate_profiles_createdAt_idx" ON "candidate_profiles"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "applications_candidateId_idx" ON "applications"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "applications_jobId_candidateId_key" ON "applications"("jobId", "candidateId");

-- CreateIndex
CREATE INDEX "poke_records_senderId_idx" ON "poke_records"("senderId");

-- CreateIndex
CREATE INDEX "poke_records_targetId_idx" ON "poke_records"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "poke_records_senderId_targetId_isEmail_key" ON "poke_records"("senderId", "targetId", "isEmail");

-- CreateIndex
CREATE UNIQUE INDEX "poke_logs_userId_yearMonth_key" ON "poke_logs"("userId", "yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "companies_marketerId_key" ON "companies"("marketerId");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "marketer_candidates_marketerId_idx" ON "marketer_candidates"("marketerId");

-- CreateIndex
CREATE UNIQUE INDEX "marketer_candidates_companyId_candidateEmail_key" ON "marketer_candidates"("companyId", "candidateEmail");

-- CreateIndex
CREATE INDEX "forwarded_openings_candidateEmail_createdAt_idx" ON "forwarded_openings"("candidateEmail", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "forwarded_openings_marketerId_candidateEmail_jobId_key" ON "forwarded_openings"("marketerId", "candidateEmail", "jobId");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketer_candidates" ADD CONSTRAINT "marketer_candidates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
