/**
 * seed.ts — Full MatchDB seed
 * Seeds: 3 users (candidate/vendor/marketer), 15 jobs, 11 candidate profiles
 *
 * Run: npx tsx src/scripts/seed.ts
 *
 * Credentials:
 *   candidate@test.com  / Test1234!     (hasPurchasedVisibility=true, plan=marketer)
 *   vendor@test.com     / Test1234!     (plan=pro)
 *   marketer@test.com   / Marketer123! (plan=marketer)
 */

import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../env", ".env.development"),
});
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MatchDB...");

  // ─── Clean existing data (order matters for FK constraints) ────────────────
  await prisma.forwardedOpening.deleteMany();
  await prisma.marketerCandidate.deleteMany();
  await prisma.company.deleteMany();
  await prisma.pokeLog.deleteMany();
  await prisma.pokeRecord.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidatePayment.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  console.log("  ✓ Cleaned existing data");

  // ─── Users ────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash("Test1234!", 12);
  const marketerPassword = await bcrypt.hash("Marketer123!", 12);

  const candidate = await prisma.user.create({
    data: {
      email: "candidate@test.com",
      password,
      username: "alex-morgan-a1b2c3",
      firstName: "Alex",
      lastName: "Morgan",
      userType: "candidate",
      hasPurchasedVisibility: true,
      membershipConfig: JSON.stringify({
        contract: ["c2c", "w2"],
        full_time: ["w2"],
      }),
      subscription: {
        create: {
          plan: "marketer",
          status: "active",
          stripeSubId: "sub_seed_candidate",
        },
      },
    },
  });

  const vendor = await prisma.user.create({
    data: {
      email: "vendor@test.com",
      password,
      username: "techcorp-hr-b2c3d4",
      firstName: "TechCorp",
      lastName: "HR",
      userType: "vendor",
      subscription: {
        create: {
          plan: "pro",
          status: "active",
          stripeSubId: "sub_seed_vendor",
        },
      },
    },
  });

  const marketer = await prisma.user.create({
    data: {
      email: "marketer@test.com",
      password: marketerPassword,
      username: "marketer-elite-c3d4e5",
      firstName: "Elite",
      lastName: "Staffing",
      userType: "marketer",
      subscription: {
        create: {
          plan: "marketer",
          status: "active",
          stripeSubId: "sub_seed_marketer",
        },
      },
    },
  });

  console.log(
    `  ✓ Users: ${candidate.email}, ${vendor.email}, ${marketer.email}`,
  );

  // ─── Jobs (15) ────────────────────────────────────────────────────────────
  const jobData = [
    {
      title: "Senior React Developer",
      description:
        "Build and maintain enterprise-grade React applications with TypeScript. Work with Redux, REST APIs, and WebSocket integrations in an agile team.",
      location: "Remote, USA",
      jobCountry: "USA",
      jobState: "CA",
      jobCity: "San Francisco",
      jobType: "contract",
      jobSubType: "c2c",
      workMode: "remote",
      payPerHour: 95,
      skillsRequired: [
        "React",
        "TypeScript",
        "Redux",
        "REST APIs",
        "WebSocket",
      ],
      experienceRequired: 5,
    },
    {
      title: "Full Stack Node.js Engineer",
      description:
        "Design and implement scalable backend services using Node.js, Express, and PostgreSQL. Frontend experience with React preferred.",
      location: "New York, USA",
      jobCountry: "USA",
      jobState: "NY",
      jobCity: "New York",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "hybrid",
      salaryMin: 120000,
      salaryMax: 150000,
      skillsRequired: [
        "Node.js",
        "Express",
        "PostgreSQL",
        "React",
        "TypeScript",
      ],
      experienceRequired: 4,
    },
    {
      title: "DevOps Engineer — AWS",
      description:
        "Manage CI/CD pipelines, containerized workloads on EKS, Terraform infrastructure, and SRE practices. On-call rotation required.",
      location: "Austin, USA",
      jobCountry: "USA",
      jobState: "TX",
      jobCity: "Austin",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "onsite",
      salaryMin: 110000,
      salaryMax: 140000,
      skillsRequired: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
      experienceRequired: 4,
    },
    {
      title: "Java Spring Boot Developer",
      description:
        "Develop microservices using Spring Boot, Kafka, and Oracle DB. Experience with Docker and Kubernetes required.",
      location: "Remote, USA",
      jobCountry: "USA",
      jobState: "TX",
      jobCity: "Dallas",
      jobType: "contract",
      jobSubType: "c2h",
      workMode: "remote",
      payPerHour: 75,
      skillsRequired: [
        "Java",
        "Spring Boot",
        "Kafka",
        "Docker",
        "Kubernetes",
        "Oracle",
      ],
      experienceRequired: 5,
    },
    {
      title: "Data Engineer — Python/Spark",
      description:
        "Build ETL pipelines, data lakes on AWS S3, and Spark jobs. Collaborate with data science team on ML feature pipelines.",
      location: "Seattle, USA",
      jobCountry: "USA",
      jobState: "WA",
      jobCity: "Seattle",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "hybrid",
      salaryMin: 130000,
      salaryMax: 160000,
      skillsRequired: [
        "Python",
        "Apache Spark",
        "AWS",
        "SQL",
        "ETL",
        "Airflow",
      ],
      experienceRequired: 4,
    },
    {
      title: "iOS Swift Developer",
      description:
        "Build consumer-facing iOS features for our fintech app. Experience with SwiftUI, CoreData, and App Store deployment required.",
      location: "Chicago, USA",
      jobCountry: "USA",
      jobState: "IL",
      jobCity: "Chicago",
      jobType: "contract",
      jobSubType: "w2",
      workMode: "remote",
      payPerHour: 85,
      skillsRequired: ["Swift", "SwiftUI", "iOS", "CoreData", "Xcode"],
      experienceRequired: 3,
    },
    {
      title: "Android Kotlin Engineer",
      description:
        "Develop and ship new features for our Android e-commerce app. MVVM architecture, Jetpack Compose, and Firebase experience required.",
      location: "Remote, USA",
      jobCountry: "USA",
      jobState: "FL",
      jobCity: "Miami",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "remote",
      salaryMin: 100000,
      salaryMax: 130000,
      skillsRequired: [
        "Kotlin",
        "Android",
        "Jetpack Compose",
        "MVVM",
        "Firebase",
      ],
      experienceRequired: 3,
    },
    {
      title: "Machine Learning Engineer",
      description:
        "Train, evaluate, and deploy ML models for NLP and recommendation systems. PyTorch, MLflow, and SageMaker experience essential.",
      location: "San Jose, USA",
      jobCountry: "USA",
      jobState: "CA",
      jobCity: "San Jose",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "hybrid",
      salaryMin: 150000,
      salaryMax: 190000,
      skillsRequired: [
        "Python",
        "PyTorch",
        "MLflow",
        "AWS SageMaker",
        "NLP",
        "Machine Learning",
      ],
      experienceRequired: 5,
    },
    {
      title: "Cybersecurity Analyst",
      description:
        "Monitor SIEM, conduct threat hunting, respond to incidents, and perform vulnerability assessments across cloud and on-prem environments.",
      location: "Washington DC, USA",
      jobCountry: "USA",
      jobState: "DC",
      jobCity: "Washington",
      jobType: "contract",
      jobSubType: "c2c",
      workMode: "onsite",
      payPerHour: 90,
      skillsRequired: [
        "SIEM",
        "Threat Hunting",
        "SOC",
        "Python",
        "AWS Security",
        "Compliance",
      ],
      experienceRequired: 4,
    },
    {
      title: "Salesforce Developer",
      description:
        "Configure and customize Salesforce CRM, build Apex triggers, LWC components, and integrate with external systems via REST/SOAP.",
      location: "Remote, USA",
      jobCountry: "USA",
      jobState: "GA",
      jobCity: "Atlanta",
      jobType: "contract",
      jobSubType: "c2c",
      workMode: "remote",
      payPerHour: 80,
      skillsRequired: ["Salesforce", "Apex", "LWC", "SOQL", "REST APIs", "CRM"],
      experienceRequired: 3,
    },
    {
      title: "QA Automation Engineer",
      description:
        "Design and maintain Selenium/Playwright test frameworks. Work with CI/CD pipelines to ensure quality gates across all releases.",
      location: "Remote, USA",
      jobCountry: "USA",
      jobState: "WA",
      jobCity: "Bellevue",
      jobType: "contract",
      jobSubType: "c2h",
      workMode: "remote",
      payPerHour: 65,
      skillsRequired: [
        "Selenium",
        "Playwright",
        "Python",
        "Java",
        "CI/CD",
        "Test Automation",
      ],
      experienceRequired: 3,
    },
    {
      title: "Angular Frontend Developer",
      description:
        "Build responsive Angular 17+ applications for our insurance platform. RxJS, NgRx, and Material Design experience required.",
      location: "Philadelphia, USA",
      jobCountry: "USA",
      jobState: "PA",
      jobCity: "Philadelphia",
      jobType: "contract",
      jobSubType: "w2",
      workMode: "hybrid",
      payPerHour: 70,
      skillsRequired: [
        "Angular",
        "TypeScript",
        "RxJS",
        "NgRx",
        "Material Design",
      ],
      experienceRequired: 3,
    },
    {
      title: "Database Administrator — PostgreSQL",
      description:
        "Manage and optimize PostgreSQL clusters, handle schema migrations, replication, backup strategies, and performance tuning.",
      location: "Denver, USA",
      jobCountry: "USA",
      jobState: "CO",
      jobCity: "Denver",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "hybrid",
      salaryMin: 95000,
      salaryMax: 120000,
      skillsRequired: [
        "PostgreSQL",
        "SQL",
        "Database Administration",
        "Replication",
        "AWS RDS",
      ],
      experienceRequired: 5,
    },
    {
      title: "Product Manager — Fintech",
      description:
        "Own the product roadmap for our payment processing platform. Work with engineering, design, and business teams to ship high-impact features.",
      location: "New York, USA",
      jobCountry: "USA",
      jobState: "NY",
      jobCity: "New York",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "onsite",
      salaryMin: 140000,
      salaryMax: 180000,
      skillsRequired: [
        "Product Management",
        "Fintech",
        "Agile",
        "JIRA",
        "SQL",
        "Analytics",
      ],
      experienceRequired: 5,
    },
    {
      title: "Scrum Master / Agile Coach",
      description:
        "Facilitate Scrum ceremonies, coach teams on agile practices, remove impediments, and help engineering teams improve velocity.",
      location: "Remote, USA",
      jobCountry: "USA",
      jobState: "OH",
      jobCity: "Columbus",
      jobType: "contract",
      jobSubType: "c2c",
      workMode: "remote",
      payPerHour: 70,
      skillsRequired: [
        "Scrum",
        "Agile",
        "JIRA",
        "Confluence",
        "Coaching",
        "Facilitation",
      ],
      experienceRequired: 4,
    },
  ];

  const jobs = await Promise.all(
    jobData.map((j) =>
      prisma.job.create({
        data: {
          ...j,
          vendorId: vendor.id,
          vendorEmail: vendor.email,
          recruiterName: "TechCorp HR",
          recruiterPhone: "+1-555-0100",
          payPerHour:
            "payPerHour" in j && j.payPerHour != null
              ? j.payPerHour
              : undefined,
          salaryMin:
            "salaryMin" in j && j.salaryMin != null ? j.salaryMin : undefined,
          salaryMax:
            "salaryMax" in j && j.salaryMax != null ? j.salaryMax : undefined,
        },
      }),
    ),
  );

  console.log(`  ✓ Jobs: ${jobs.length} created`);

  // ─── Candidate Profiles (10) ──────────────────────────────────────────────
  const profileData = [
    {
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+1-555-0201",
      currentCompany: "Infosys",
      currentRole: "Senior Software Engineer",
      preferredJobType: "contract",
      expectedHourlyRate: 85,
      experienceYears: 6,
      skills: ["React", "TypeScript", "Node.js", "AWS", "PostgreSQL"],
      location: "Remote",
      profileCountry: "USA",
      bio: "Full-stack developer with 6 years building enterprise SaaS products. Expert in React ecosystem and cloud-native architectures.",
      resumeSummary:
        "Senior full-stack engineer specializing in React and Node.js with strong AWS background.",
      resumeExperience:
        "Infosys (2021–present): Led frontend team of 5, delivered 3 major product releases.\nWipro (2018–2021): Built REST APIs serving 10M+ requests/day.",
      resumeEducation: "B.Tech Computer Science, IIT Bombay, 2018",
      resumeAchievements:
        "AWS Certified Solutions Architect. Speaker at ReactConf 2023.",
      visibilityConfig: { contract: ["c2c", "w2", "c2h"] },
      profileLocked: true,
    },
    {
      name: "Carlos Rivera",
      email: "carlos.rivera@example.com",
      phone: "+1-555-0202",
      currentCompany: "Accenture",
      currentRole: "Java Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 75,
      experienceYears: 5,
      skills: [
        "Java",
        "Spring Boot",
        "Kafka",
        "Docker",
        "Oracle",
        "Microservices",
      ],
      location: "Dallas, TX",
      profileCountry: "USA",
      bio: "Java microservices developer with deep experience in financial services domain.",
      resumeSummary:
        "Java Spring Boot developer with 5 years in banking and fintech microservices.",
      resumeExperience:
        "Accenture (2020–present): Developed payment processing microservices using Spring Boot and Kafka.\nTCS (2019–2020): Maintained legacy Oracle banking systems.",
      resumeEducation: "B.S. Computer Science, University of Texas, 2019",
      resumeAchievements: "Oracle Certified Professional Java Developer.",
      visibilityConfig: { contract: ["c2h", "w2"] },
      profileLocked: true,
    },
    {
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      phone: "+1-555-0203",
      currentCompany: "Amazon",
      currentRole: "Data Engineer",
      preferredJobType: "full_time",
      expectedHourlyRate: 120,
      experienceYears: 7,
      skills: [
        "Python",
        "Apache Spark",
        "AWS",
        "SQL",
        "ETL",
        "Airflow",
        "Databricks",
      ],
      location: "Seattle, WA",
      profileCountry: "USA",
      bio: "Data engineer with expertise in building large-scale data pipelines and ML feature stores.",
      resumeSummary:
        "Senior data engineer at Amazon with 7 years building petabyte-scale data pipelines.",
      resumeExperience:
        "Amazon (2020–present): Built real-time recommendation pipeline processing 500M events/day.\nMicrosoft (2017–2020): Developed ETL pipelines for Azure Data Factory.",
      resumeEducation: "M.S. Data Science, University of Washington, 2017",
      resumeAchievements:
        "AWS Certified Data Analytics Specialty. Published 2 data engineering blog posts on Medium with 50K+ views.",
      visibilityConfig: { full_time: ["w2"] },
      profileLocked: true,
    },
    {
      name: "Marcus Johnson",
      email: "marcus.johnson@example.com",
      phone: "+1-555-0204",
      currentCompany: "Deloitte",
      currentRole: "Salesforce Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 80,
      experienceYears: 4,
      skills: ["Salesforce", "Apex", "LWC", "SOQL", "REST APIs", "CRM", "CPQ"],
      location: "Atlanta, GA",
      profileCountry: "USA",
      bio: "Salesforce-certified developer with experience across Sales Cloud, Service Cloud, and CPQ.",
      resumeSummary:
        "Salesforce developer with 4 years delivering CRM solutions for enterprise clients.",
      resumeExperience:
        "Deloitte (2022–present): Salesforce architect for insurance client, migrated 500K records.\nCapgemini (2020–2022): Built LWC components for healthcare CRM.",
      resumeEducation:
        "B.S. Information Systems, Georgia State University, 2020",
      resumeAchievements:
        "Salesforce Certified Platform Developer II. Salesforce Administrator certification.",
      visibilityConfig: { contract: ["c2c", "w2"] },
      profileLocked: true,
    },
    {
      name: "Emily Rodriguez",
      email: "emily.rodriguez@example.com",
      phone: "+1-555-0205",
      currentCompany: "Google",
      currentRole: "Machine Learning Engineer",
      preferredJobType: "full_time",
      expectedHourlyRate: 150,
      experienceYears: 5,
      skills: [
        "Python",
        "PyTorch",
        "TensorFlow",
        "MLflow",
        "AWS SageMaker",
        "NLP",
        "Computer Vision",
      ],
      location: "Mountain View, CA",
      profileCountry: "USA",
      bio: "ML engineer specializing in NLP and recommendation systems at Google scale.",
      resumeSummary:
        "ML engineer at Google with 5 years in production NLP and recommendation system deployment.",
      resumeExperience:
        "Google (2021–present): Lead ML engineer for Google Search ranking improvements.\nFacebook (2019–2021): Developed content moderation NLP models.",
      resumeEducation: "M.S. Machine Learning, Stanford University, 2019",
      resumeAchievements:
        "Published paper at NeurIPS 2022. Google ML Excellence Award 2023.",
      visibilityConfig: { full_time: ["w2"] },
      profileLocked: true,
    },
    {
      name: "David Kim",
      email: "david.kim@example.com",
      phone: "+1-555-0206",
      currentCompany: "Netflix",
      currentRole: "DevOps Engineer",
      preferredJobType: "full_time",
      expectedHourlyRate: 120,
      experienceYears: 6,
      skills: [
        "AWS",
        "Docker",
        "Kubernetes",
        "Terraform",
        "CI/CD",
        "Jenkins",
        "Prometheus",
      ],
      location: "Los Angeles, CA",
      profileCountry: "USA",
      bio: "DevOps/SRE engineer with focus on high-availability infrastructure and cost optimization.",
      resumeSummary:
        "Senior DevOps engineer at Netflix with 6 years managing cloud-native infrastructure at scale.",
      resumeExperience:
        "Netflix (2021–present): Managed EKS clusters serving 200M+ users. Reduced infra costs by 30%.\nLinkedIn (2018–2021): Built CI/CD pipelines processing 2000+ deployments/day.",
      resumeEducation: "B.S. Computer Engineering, UC San Diego, 2018",
      resumeAchievements:
        "AWS Certified DevOps Engineer Professional. Kubernetes CKA certified.",
      visibilityConfig: { full_time: ["w2"] },
      profileLocked: true,
    },
    {
      name: "Aisha Patel",
      email: "aisha.patel@example.com",
      phone: "+1-555-0207",
      currentCompany: "JPMorgan Chase",
      currentRole: "Cybersecurity Analyst",
      preferredJobType: "contract",
      expectedHourlyRate: 90,
      experienceYears: 5,
      skills: [
        "SIEM",
        "Threat Hunting",
        "SOC",
        "Python",
        "AWS Security",
        "Splunk",
        "MITRE ATT&CK",
      ],
      location: "New York, NY",
      profileCountry: "USA",
      bio: "Cybersecurity analyst with extensive financial services SOC experience and threat intelligence background.",
      resumeSummary:
        "Cybersecurity analyst at JPMorgan with 5 years in threat hunting and incident response.",
      resumeExperience:
        "JPMorgan Chase (2021–present): L2 SOC analyst, investigated 500+ security incidents.\nPwC (2019–2021): Penetration tester for banking and fintech clients.",
      resumeEducation:
        "B.S. Cybersecurity, NYU Tandon School of Engineering, 2019",
      resumeAchievements:
        "CISSP certified. CEH certified. Discovered 3 critical CVEs in open-source projects.",
      visibilityConfig: { contract: ["c2c", "w2"] },
      profileLocked: true,
    },
    {
      name: "James Wilson",
      email: "james.wilson@example.com",
      phone: "+1-555-0208",
      currentCompany: "Microsoft",
      currentRole: "iOS Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 90,
      experienceYears: 6,
      skills: [
        "Swift",
        "SwiftUI",
        "iOS",
        "CoreData",
        "Xcode",
        "Objective-C",
        "REST APIs",
      ],
      location: "Redmond, WA",
      profileCountry: "USA",
      bio: "iOS developer with 6 years shipping apps to the App Store. Focus on performance and smooth UX.",
      resumeSummary:
        "Senior iOS developer at Microsoft with 6 years building consumer and enterprise iOS applications.",
      resumeExperience:
        "Microsoft (2020–present): Lead iOS dev for Teams mobile app, 100M+ downloads.\nApple (2018–2020): iOS SDK developer tools team.",
      resumeEducation: "B.S. Computer Science, University of Michigan, 2018",
      resumeAchievements:
        "Apple WWDC scholarship winner 2017. App Store App of the Year 2022 team member.",
      visibilityConfig: { contract: ["w2", "c2h"] },
      profileLocked: true,
    },
    {
      name: "Nina Kowalski",
      email: "nina.kowalski@example.com",
      phone: "+1-555-0209",
      currentCompany: "IBM",
      currentRole: "QA Automation Engineer",
      preferredJobType: "contract",
      expectedHourlyRate: 65,
      experienceYears: 4,
      skills: [
        "Selenium",
        "Playwright",
        "Python",
        "Java",
        "CI/CD",
        "TestNG",
        "JIRA",
      ],
      location: "Chicago, IL",
      profileCountry: "USA",
      bio: "QA automation engineer passionate about building robust test frameworks that catch bugs before they reach production.",
      resumeSummary:
        "QA automation engineer with 4 years building end-to-end test frameworks for enterprise applications.",
      resumeExperience:
        "IBM (2022–present): Built Playwright test suite with 2000+ tests, 95% coverage.\nCognizant (2020–2022): Selenium automation for healthcare portal.",
      resumeEducation: "B.S. Software Engineering, DePaul University, 2020",
      resumeAchievements:
        "ISTQB certified tester. Reduced regression testing time by 70% through automation.",
      visibilityConfig: { contract: ["c2c", "c2h", "w2"] },
      profileLocked: true,
    },
    {
      name: "Robert Thompson",
      email: "robert.thompson@example.com",
      phone: "+1-555-0210",
      currentCompany: "Oracle",
      currentRole: "Database Administrator",
      preferredJobType: "full_time",
      expectedHourlyRate: 100,
      experienceYears: 8,
      skills: [
        "PostgreSQL",
        "Oracle",
        "SQL",
        "Database Administration",
        "Replication",
        "AWS RDS",
        "Performance Tuning",
      ],
      location: "Denver, CO",
      profileCountry: "USA",
      bio: "Senior DBA with 8 years managing large-scale Oracle and PostgreSQL environments for Fortune 500 companies.",
      resumeSummary:
        "Senior database administrator with 8 years specializing in PostgreSQL and Oracle performance optimization.",
      resumeExperience:
        "Oracle (2019–present): DBA for cloud database services, managed 500+ customer clusters.\nFidelity Investments (2016–2019): Lead DBA for trading systems DB infrastructure.",
      resumeEducation:
        "B.S. Information Technology, Colorado State University, 2016",
      resumeAchievements:
        "Oracle Database 19c Certified Master. AWS Database Specialty certified. Optimized query that reduced execution time from 45s to 0.3s.",
      visibilityConfig: { full_time: ["w2"] },
      profileLocked: true,
    },
  ];

  // ── Profile for the logged-in candidate user (candidate@test.com) ──────
  const candidateProfile = await prisma.candidateProfile.create({
    data: {
      candidateId: candidate.id, // real UUID — so getProfile / candidateMatches work
      username: "alex-morgan-a1b2c3",
      name: "Alex Morgan",
      email: candidate.email,
      phone: "+1-555-0200",
      currentCompany: "Freelance",
      currentRole: "Senior React Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 90,
      experienceYears: 5,
      skills: ["React", "TypeScript", "Node.js", "Redux", "PostgreSQL", "AWS"],
      location: "Remote",
      profileCountry: "USA",
      bio: "Full-stack JavaScript developer with 5 years building SaaS products. React & Node.js expert.",
      resumeSummary:
        "Senior React developer specializing in TypeScript-based SaaS applications.",
      resumeExperience:
        "Freelance (2023–present): Built micro-frontend platform for HR-tech startup.\n" +
        "TechGlobal Inc (2020–2023): Led frontend team delivering enterprise dashboards.",
      resumeEducation: "B.S. Computer Science, UCLA, 2019",
      resumeAchievements:
        "AWS Certified Developer Associate. Open-source contributor to Remix.",
      visibilityConfig: { contract: ["c2c", "w2"] },
      profileLocked: true,
    },
  });

  // ── 10 additional browsable candidate profiles ────────────────────────────
  const profiles = await Promise.all(
    profileData.map((p, i) =>
      prisma.candidateProfile.create({
        data: {
          ...p,
          candidateId: `seed-candidate-${String(i + 1).padStart(3, "0")}`,
          username: p.email.split("@")[0].replace(/\./g, "-"),
          visibilityConfig: p.visibilityConfig as any,
          expectedHourlyRate:
            p.expectedHourlyRate != null ? p.expectedHourlyRate : undefined,
        },
      }),
    ),
  );

  console.log(
    `  ✓ Candidate profiles: 1 (logged-in) + ${profiles.length} (browsable) created`,
  );

  // ─── Marketer Company + Candidates ────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: "Elite Staffing Solutions",
      marketerId: marketer.id,
      marketerEmail: marketer.email,
    },
  });

  await prisma.marketerCandidate.createMany({
    data: [
      {
        companyId: company.id,
        marketerId: marketer.id,
        candidateId: "seed-candidate-001",
        candidateName: "Priya Sharma",
        candidateEmail: "priya.sharma@example.com",
      },
      {
        companyId: company.id,
        marketerId: marketer.id,
        candidateId: "seed-candidate-002",
        candidateName: "Carlos Rivera",
        candidateEmail: "carlos.rivera@example.com",
      },
      {
        companyId: company.id,
        marketerId: marketer.id,
        candidateId: "seed-candidate-004",
        candidateName: "Marcus Johnson",
        candidateEmail: "marcus.johnson@example.com",
      },
    ],
  });

  console.log(`  ✓ Company: ${company.name}, 3 candidates registered`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log("\nTest credentials:");
  console.log(
    "  candidate@test.com  / Test1234!     (userType: candidate, hasPurchasedVisibility: true)",
  );
  console.log(
    "  vendor@test.com     / Test1234!     (userType: vendor, plan: pro)",
  );
  console.log(
    "  marketer@test.com   / Marketer123!  (userType: marketer, plan: marketer)",
  );
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
