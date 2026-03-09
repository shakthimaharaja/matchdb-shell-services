/**
 * seed.ts — Full MatchDB seed
 * Seeds: 3 users, 25 jobs, 25 candidate profiles, 25 rostered candidates, 25 forwarded openings
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

  // ─── Jobs (25) ────────────────────────────────────────────────────────────
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
    // ── New jobs 16–25 ──────────────────────────────────────────────────────
    {
      title: "Cloud Solutions Architect — Azure",
      description:
        "Design and implement enterprise cloud solutions on Microsoft Azure. Lead cloud migration projects and establish governance frameworks.",
      location: "Boston, USA",
      jobCountry: "USA",
      jobState: "MA",
      jobCity: "Boston",
      jobType: "full_time",
      jobSubType: "direct_hire",
      workMode: "hybrid",
      salaryMin: 150000,
      salaryMax: 190000,
      skillsRequired: [
        "Azure",
        "Cloud Architecture",
        "Terraform",
        "Kubernetes",
        "Networking",
      ],
      experienceRequired: 7,
    },
    {
      title: "Technical Writer — API Documentation",
      description:
        "Create and maintain API documentation, developer guides, and SDK references. Work closely with engineering teams to ensure accuracy.",
      location: "Remote, USA",
      jobCountry: "USA",
      jobState: "OR",
      jobCity: "Portland",
      jobType: "contract",
      jobSubType: "w2",
      workMode: "remote",
      payPerHour: 55,
      skillsRequired: [
        "Technical Writing",
        "API Documentation",
        "Markdown",
        "OpenAPI",
        "Git",
      ],
      experienceRequired: 3,
    },
    {
      title: "Blockchain Developer — Solidity",
      description:
        "Build and audit smart contracts on Ethereum and L2 chains. Experience with DeFi protocols and security best practices required.",
      location: "Miami, USA",
      jobCountry: "USA",
      jobState: "FL",
      jobCity: "Miami",
      jobType: "contract",
      jobSubType: "c2c",
      workMode: "remote",
      payPerHour: 120,
      skillsRequired: [
        "Solidity",
        "Ethereum",
        "Web3.js",
        "Smart Contracts",
        "DeFi",
      ],
      experienceRequired: 3,
    },
    {
      title: "UI/UX Designer — Figma",
      description:
        "Design intuitive user interfaces for our SaaS platform. Conduct user research, create wireframes, prototypes, and design systems.",
      location: "San Francisco, USA",
      jobCountry: "USA",
      jobState: "CA",
      jobCity: "San Francisco",
      jobType: "full_time",
      jobSubType: "salary",
      workMode: "hybrid",
      salaryMin: 110000,
      salaryMax: 145000,
      skillsRequired: [
        "Figma",
        "UI Design",
        "UX Research",
        "Prototyping",
        "Design Systems",
      ],
      experienceRequired: 4,
    },
    {
      title: "Site Reliability Engineer",
      description:
        "Ensure 99.99% uptime for production systems. Build monitoring, alerting, and automation tools. Manage incident response processes.",
      location: "Portland, USA",
      jobCountry: "USA",
      jobState: "OR",
      jobCity: "Portland",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "remote",
      salaryMin: 140000,
      salaryMax: 175000,
      skillsRequired: [
        "SRE",
        "Prometheus",
        "Grafana",
        "Kubernetes",
        "Python",
        "Incident Management",
      ],
      experienceRequired: 5,
    },
    {
      title: ".NET Backend Developer",
      description:
        "Develop enterprise APIs and microservices using .NET 8, C#, and SQL Server. Azure DevOps experience preferred.",
      location: "Charlotte, USA",
      jobCountry: "USA",
      jobState: "NC",
      jobCity: "Charlotte",
      jobType: "contract",
      jobSubType: "c2h",
      workMode: "hybrid",
      payPerHour: 75,
      skillsRequired: [".NET", "C#", "SQL Server", "Azure", "Microservices"],
      experienceRequired: 4,
    },
    {
      title: "Embedded Systems Engineer — C++",
      description:
        "Develop firmware for IoT devices. Experience with ARM Cortex processors, RTOS, and hardware-software integration required.",
      location: "Detroit, USA",
      jobCountry: "USA",
      jobState: "MI",
      jobCity: "Detroit",
      jobType: "full_time",
      jobSubType: "w2",
      workMode: "onsite",
      salaryMin: 115000,
      salaryMax: 145000,
      skillsRequired: [
        "C++",
        "Embedded Systems",
        "RTOS",
        "ARM",
        "IoT",
        "Firmware",
      ],
      experienceRequired: 5,
    },
    {
      title: "Go Backend Developer",
      description:
        "Build high-performance microservices in Go. Experience with gRPC, distributed systems, and cloud-native development required.",
      location: "Remote, USA",
      jobCountry: "USA",
      jobState: "CO",
      jobCity: "Boulder",
      jobType: "contract",
      jobSubType: "c2c",
      workMode: "remote",
      payPerHour: 100,
      skillsRequired: [
        "Go",
        "gRPC",
        "Microservices",
        "Docker",
        "Kubernetes",
        "PostgreSQL",
      ],
      experienceRequired: 4,
    },
    {
      title: "Ruby on Rails Developer",
      description:
        "Maintain and extend our Ruby on Rails platform. Experience with Sidekiq, Redis, and PostgreSQL for high-traffic applications.",
      location: "San Diego, USA",
      jobCountry: "USA",
      jobState: "CA",
      jobCity: "San Diego",
      jobType: "contract",
      jobSubType: "w2",
      workMode: "hybrid",
      payPerHour: 80,
      skillsRequired: ["Ruby", "Rails", "PostgreSQL", "Redis", "Sidekiq"],
      experienceRequired: 4,
    },
    {
      title: "ETL Developer — Informatica",
      description:
        "Design and maintain ETL workflows using Informatica PowerCenter. Support data warehouse operations and data quality initiatives.",
      location: "Minneapolis, USA",
      jobCountry: "USA",
      jobState: "MN",
      jobCity: "Minneapolis",
      jobType: "contract",
      jobSubType: "c2h",
      workMode: "onsite",
      payPerHour: 70,
      skillsRequired: [
        "Informatica",
        "ETL",
        "SQL",
        "Data Warehouse",
        "Oracle",
        "Python",
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

  // ─── Candidate Profiles (24 browsable) ────────────────────────────────────
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
      bio: "Full-stack developer with 6 years building enterprise SaaS products.",
      resumeSummary:
        "Senior full-stack engineer specializing in React and Node.js with strong AWS background.",
      resumeExperience:
        "Infosys (2021–present): Led frontend team of 5.\nWipro (2018–2021): Built REST APIs serving 10M+ requests/day.",
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
        "Accenture (2020–present): Payment processing microservices.\nTCS (2019–2020): Oracle banking systems.",
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
        "Amazon (2020–present): Real-time recommendation pipeline.\nMicrosoft (2017–2020): ETL pipelines for Azure Data Factory.",
      resumeEducation: "M.S. Data Science, University of Washington, 2017",
      resumeAchievements: "AWS Certified Data Analytics Specialty.",
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
        "Deloitte (2022–present): Salesforce architect for insurance client.\nCapgemini (2020–2022): LWC components for healthcare CRM.",
      resumeEducation:
        "B.S. Information Systems, Georgia State University, 2020",
      resumeAchievements: "Salesforce Certified Platform Developer II.",
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
        "ML engineer at Google with 5 years in production NLP and recommendation systems.",
      resumeExperience:
        "Google (2021–present): Lead ML engineer for Search ranking.\nFacebook (2019–2021): Content moderation NLP models.",
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
        "Netflix (2021–present): Managed EKS clusters serving 200M+ users.\nLinkedIn (2018–2021): CI/CD pipelines processing 2000+ deployments/day.",
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
      bio: "Cybersecurity analyst with extensive financial services SOC experience.",
      resumeSummary:
        "Cybersecurity analyst at JPMorgan with 5 years in threat hunting and incident response.",
      resumeExperience:
        "JPMorgan Chase (2021–present): L2 SOC analyst, 500+ incidents investigated.\nPwC (2019–2021): Penetration tester for fintech clients.",
      resumeEducation: "B.S. Cybersecurity, NYU Tandon, 2019",
      resumeAchievements:
        "CISSP certified. CEH certified. Discovered 3 critical CVEs.",
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
      bio: "iOS developer with 6 years shipping apps to the App Store.",
      resumeSummary:
        "Senior iOS developer at Microsoft building consumer and enterprise iOS applications.",
      resumeExperience:
        "Microsoft (2020–present): Lead iOS dev for Teams mobile app.\nApple (2018–2020): iOS SDK developer tools team.",
      resumeEducation: "B.S. Computer Science, University of Michigan, 2018",
      resumeAchievements:
        "WWDC scholarship winner 2017. App of the Year 2022 team member.",
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
      bio: "QA automation engineer passionate about building robust test frameworks.",
      resumeSummary:
        "QA automation engineer with 4 years building end-to-end test frameworks.",
      resumeExperience:
        "IBM (2022–present): Playwright test suite with 2000+ tests.\nCognizant (2020–2022): Selenium automation for healthcare portal.",
      resumeEducation: "B.S. Software Engineering, DePaul University, 2020",
      resumeAchievements:
        "ISTQB certified tester. Reduced regression time by 70%.",
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
      bio: "Senior DBA with 8 years managing large-scale Oracle and PostgreSQL environments.",
      resumeSummary:
        "Senior DBA specializing in PostgreSQL and Oracle performance optimization.",
      resumeExperience:
        "Oracle (2019–present): DBA for cloud database services.\nFidelity (2016–2019): Lead DBA for trading systems.",
      resumeEducation:
        "B.S. Information Technology, Colorado State University, 2016",
      resumeAchievements:
        "Oracle 19c Certified Master. AWS Database Specialty certified.",
      visibilityConfig: { full_time: ["w2"] },
      profileLocked: true,
    },
    // ── New profiles 11–24 ──────────────────────────────────────────────────
    {
      name: "Alex Thompson",
      email: "alex.thompson@example.com",
      phone: "+1-555-0211",
      currentCompany: "Uber",
      currentRole: "Angular Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 75,
      experienceYears: 4,
      skills: [
        "Angular",
        "TypeScript",
        "RxJS",
        "NgRx",
        "Material Design",
        "REST APIs",
      ],
      location: "Philadelphia, PA",
      profileCountry: "USA",
      bio: "Angular specialist building enterprise insurance platforms with complex form workflows.",
      resumeSummary:
        "Angular developer with 4 years building responsive enterprise applications.",
      resumeExperience:
        "Uber (2022–present): Frontend dev for driver management portal.\nAccenture (2020–2022): Angular apps for insurance client.",
      resumeEducation: "B.S. Computer Science, Temple University, 2020",
      resumeAchievements: "Google Cloud Certified. Angular contributor.",
      visibilityConfig: { contract: ["w2", "c2h"] },
      profileLocked: true,
    },
    {
      name: "Maya Singh",
      email: "maya.singh@example.com",
      phone: "+1-555-0212",
      currentCompany: "AWS",
      currentRole: "Cloud Solutions Architect",
      preferredJobType: "full_time",
      expectedHourlyRate: 140,
      experienceYears: 8,
      skills: [
        "Azure",
        "Cloud Architecture",
        "Terraform",
        "Kubernetes",
        "Networking",
        "AWS",
      ],
      location: "Boston, MA",
      profileCountry: "USA",
      bio: "Cloud architect with 8 years designing enterprise migration strategies across AWS and Azure.",
      resumeSummary:
        "Cloud solutions architect with expertise in multi-cloud enterprise environments.",
      resumeExperience:
        "AWS (2020–present): Principal architect for enterprise accounts.\nRackspace (2017–2020): Cloud migration consultant.",
      resumeEducation: "M.S. Cloud Computing, Boston University, 2017",
      resumeAchievements:
        "AWS SA Professional + Azure SA Expert dual certified.",
      visibilityConfig: { full_time: ["w2", "direct_hire"] },
      profileLocked: true,
    },
    {
      name: "Brandon Lee",
      email: "brandon.lee@example.com",
      phone: "+1-555-0213",
      currentCompany: "Coinbase",
      currentRole: "Blockchain Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 120,
      experienceYears: 4,
      skills: [
        "Solidity",
        "Ethereum",
        "Web3.js",
        "Smart Contracts",
        "DeFi",
        "Hardhat",
      ],
      location: "Miami, FL",
      profileCountry: "USA",
      bio: "Blockchain developer building and auditing smart contracts on Ethereum and L2 chains.",
      resumeSummary:
        "Smart contract developer with 4 years in DeFi protocol development.",
      resumeExperience:
        "Coinbase (2022–present): L2 bridge smart contracts.\nConsenSys (2020–2022): DeFi protocol auditing.",
      resumeEducation: "B.S. Mathematics, MIT, 2020",
      resumeAchievements:
        "Found critical vulnerability in major DeFi protocol. Solidity auditor.",
      visibilityConfig: { contract: ["c2c", "1099"] },
      profileLocked: true,
    },
    {
      name: "Sofia Garcia",
      email: "sofia.garcia@example.com",
      phone: "+1-555-0214",
      currentCompany: "Figma",
      currentRole: "Senior UI/UX Designer",
      preferredJobType: "full_time",
      expectedHourlyRate: 110,
      experienceYears: 6,
      skills: [
        "Figma",
        "UI Design",
        "UX Research",
        "Prototyping",
        "Design Systems",
        "CSS",
      ],
      location: "San Francisco, CA",
      profileCountry: "USA",
      bio: "UI/UX designer passionate about creating intuitive and accessible design systems.",
      resumeSummary:
        "Senior product designer with 6 years crafting enterprise SaaS interfaces.",
      resumeExperience:
        "Figma (2022–present): Design system lead.\nAirbnb (2019–2022): UX designer for host tools.",
      resumeEducation: "B.F.A. Interaction Design, RISD, 2019",
      resumeAchievements:
        "Red Dot Design Award 2023. Built design system used by 200+ devs.",
      visibilityConfig: { full_time: ["salary", "w2"] },
      profileLocked: true,
    },
    {
      name: "Tyler Morrison",
      email: "tyler.morrison@example.com",
      phone: "+1-555-0215",
      currentCompany: "Datadog",
      currentRole: "Site Reliability Engineer",
      preferredJobType: "full_time",
      expectedHourlyRate: 130,
      experienceYears: 5,
      skills: [
        "SRE",
        "Prometheus",
        "Grafana",
        "Kubernetes",
        "Python",
        "Incident Management",
      ],
      location: "Portland, OR",
      profileCountry: "USA",
      bio: "SRE focused on observability, incident management, and 99.99% uptime guarantees.",
      resumeSummary:
        "SRE at Datadog ensuring five-nines availability for monitoring platform.",
      resumeExperience:
        "Datadog (2022–present): SRE for core metrics pipeline.\nGitHub (2019–2022): Reliability engineering for CI/CD platform.",
      resumeEducation: "B.S. Computer Science, Oregon State University, 2019",
      resumeAchievements:
        "Kubernetes CKA. Designed incident response process reducing MTTR by 60%.",
      visibilityConfig: { full_time: ["w2"] },
      profileLocked: true,
    },
    {
      name: "Rachel Kim",
      email: "rachel.kim@example.com",
      phone: "+1-555-0216",
      currentCompany: "Bank of America",
      currentRole: ".NET Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 75,
      experienceYears: 5,
      skills: [
        ".NET",
        "C#",
        "SQL Server",
        "Azure",
        "Microservices",
        "Entity Framework",
      ],
      location: "Charlotte, NC",
      profileCountry: "USA",
      bio: ".NET developer building enterprise banking microservices with Azure cloud infrastructure.",
      resumeSummary:
        ".NET developer with 5 years in financial services enterprise applications.",
      resumeExperience:
        "Bank of America (2021–present): .NET microservices for loan processing.\nWells Fargo (2019–2021): C# WPF desktop applications.",
      resumeEducation: "B.S. Computer Science, UNC Charlotte, 2019",
      resumeAchievements:
        "Azure Developer Associate certified. Microsoft MVP nominee.",
      visibilityConfig: { contract: ["c2h", "w2"] },
      profileLocked: true,
    },
    {
      name: "Mohammed Ali",
      email: "mohammed.ali@example.com",
      phone: "+1-555-0217",
      currentCompany: "Tesla",
      currentRole: "Embedded Systems Engineer",
      preferredJobType: "full_time",
      expectedHourlyRate: 110,
      experienceYears: 6,
      skills: [
        "C++",
        "Embedded Systems",
        "RTOS",
        "ARM",
        "IoT",
        "Firmware",
        "Python",
      ],
      location: "Detroit, MI",
      profileCountry: "USA",
      bio: "Embedded engineer designing firmware for automotive and IoT devices at Tesla.",
      resumeSummary:
        "Embedded systems engineer with 6 years in automotive firmware and IoT.",
      resumeExperience:
        "Tesla (2021–present): Firmware for vehicle control systems.\nBosch (2018–2021): IoT sensor firmware development.",
      resumeEducation:
        "M.S. Electrical Engineering, University of Michigan, 2018",
      resumeAchievements:
        "3 patents in automotive embedded systems. ARM certified engineer.",
      visibilityConfig: { full_time: ["w2"] },
      profileLocked: true,
    },
    {
      name: "Lisa Chang",
      email: "lisa.chang@example.com",
      phone: "+1-555-0218",
      currentCompany: "Cloudflare",
      currentRole: "Go Backend Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 100,
      experienceYears: 5,
      skills: [
        "Go",
        "gRPC",
        "Microservices",
        "Docker",
        "Kubernetes",
        "PostgreSQL",
      ],
      location: "Remote",
      profileCountry: "USA",
      bio: "Go developer building high-performance distributed systems at Cloudflare.",
      resumeSummary:
        "Backend engineer specializing in Go microservices and distributed systems.",
      resumeExperience:
        "Cloudflare (2022–present): Go services for edge computing.\nHashiCorp (2019–2022): Contributed to Consul and Vault Go codebase.",
      resumeEducation:
        "B.S. Computer Science, Carnegie Mellon University, 2019",
      resumeAchievements:
        "Open-source contributor to Go ecosystem. GopherCon speaker 2024.",
      visibilityConfig: { contract: ["c2c", "1099"] },
      profileLocked: true,
    },
    {
      name: "Patrick O'Brien",
      email: "patrick.obrien@example.com",
      phone: "+1-555-0219",
      currentCompany: "Shopify",
      currentRole: "Ruby on Rails Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 80,
      experienceYears: 5,
      skills: ["Ruby", "Rails", "PostgreSQL", "Redis", "Sidekiq", "GraphQL"],
      location: "San Diego, CA",
      profileCountry: "USA",
      bio: "Rails developer with expertise in e-commerce platforms and high-traffic applications.",
      resumeSummary:
        "Ruby on Rails developer with 5 years building scalable e-commerce platforms.",
      resumeExperience:
        "Shopify (2021–present): Core platform Rails engineer.\nBasecamp (2019–2021): Built Hotwire-based productivity features.",
      resumeEducation:
        "B.S. Software Engineering, San Diego State University, 2019",
      resumeAchievements: "Rails contributor. Built gem with 5K+ GitHub stars.",
      visibilityConfig: { contract: ["w2", "c2h"] },
      profileLocked: true,
    },
    {
      name: "Anita Desai",
      email: "anita.desai@example.com",
      phone: "+1-555-0220",
      currentCompany: "Target",
      currentRole: "ETL Developer",
      preferredJobType: "contract",
      expectedHourlyRate: 70,
      experienceYears: 5,
      skills: [
        "Informatica",
        "ETL",
        "SQL",
        "Data Warehouse",
        "Oracle",
        "Python",
        "Snowflake",
      ],
      location: "Minneapolis, MN",
      profileCountry: "USA",
      bio: "ETL developer designing data warehouse solutions for retail analytics.",
      resumeSummary:
        "ETL developer with 5 years in retail data warehouse and analytics pipelines.",
      resumeExperience:
        "Target (2021–present): Informatica ETL for supply chain analytics.\nBest Buy (2019–2021): Oracle data warehouse maintenance.",
      resumeEducation: "M.S. Data Analytics, University of Minnesota, 2019",
      resumeAchievements:
        "Informatica PowerCenter certified. Snowflake SnowPro Core certified.",
      visibilityConfig: { contract: ["c2h", "w2"] },
      profileLocked: true,
    },
    {
      name: "Chris Baker",
      email: "chris.baker@example.com",
      phone: "+1-555-0221",
      currentCompany: "Stripe",
      currentRole: "Technical Writer",
      preferredJobType: "contract",
      expectedHourlyRate: 55,
      experienceYears: 4,
      skills: [
        "Technical Writing",
        "API Documentation",
        "Markdown",
        "OpenAPI",
        "Git",
        "Developer Experience",
      ],
      location: "Remote",
      profileCountry: "USA",
      bio: "Technical writer creating world-class API documentation and developer guides.",
      resumeSummary:
        "Technical writer at Stripe with 4 years creating developer-facing documentation.",
      resumeExperience:
        "Stripe (2022–present): API reference docs and integration guides.\nTwilio (2020–2022): SDK documentation and tutorials.",
      resumeEducation: "B.A. Technical Communication, Georgia Tech, 2020",
      resumeAchievements:
        "Write the Docs conference speaker. Created docs reducing support tickets by 40%.",
      visibilityConfig: { contract: ["w2"] },
      profileLocked: true,
    },
    {
      name: "Yuki Tanaka",
      email: "yuki.tanaka@example.com",
      phone: "+1-555-0222",
      currentCompany: "Spotify",
      currentRole: "Agile Coach",
      preferredJobType: "contract",
      expectedHourlyRate: 80,
      experienceYears: 6,
      skills: [
        "Scrum",
        "Agile",
        "JIRA",
        "Confluence",
        "Coaching",
        "Facilitation",
        "SAFe",
      ],
      location: "Remote",
      profileCountry: "USA",
      bio: "Agile coach helping engineering teams optimize their delivery processes at Spotify.",
      resumeSummary:
        "Agile coach and Scrum Master with 6 years transforming engineering organizations.",
      resumeExperience:
        "Spotify (2022–present): Agile coach for 4 squads.\nThoughtWorks (2019–2022): Scrum Master for multiple agile teams.",
      resumeEducation: "B.S. Management Information Systems, UT Austin, 2019",
      resumeAchievements:
        "CSM + CSP certified. SAFe Program Consultant. Led 3 successful agile transformations.",
      visibilityConfig: { contract: ["c2c", "w2"] },
      profileLocked: true,
    },
    {
      name: "Daniel Scott",
      email: "daniel.scott@example.com",
      phone: "+1-555-0223",
      currentCompany: "Samsung",
      currentRole: "Android Developer",
      preferredJobType: "full_time",
      expectedHourlyRate: 95,
      experienceYears: 4,
      skills: [
        "Kotlin",
        "Android",
        "Jetpack Compose",
        "MVVM",
        "Firebase",
        "Coroutines",
      ],
      location: "Remote",
      profileCountry: "USA",
      bio: "Android developer building consumer apps with Jetpack Compose and modern architecture.",
      resumeSummary:
        "Android developer with 4 years building consumer mobile applications.",
      resumeExperience:
        "Samsung (2022–present): Android dev for Galaxy wearables companion app.\nLyft (2020–2022): Driver-side Android features.",
      resumeEducation: "B.S. Computer Science, Virginia Tech, 2020",
      resumeAchievements:
        "Google Certified Android Developer. Kotlin GDE nominee.",
      visibilityConfig: { full_time: ["w2"] },
      profileLocked: true,
    },
    {
      name: "Olivia White",
      email: "olivia.white@example.com",
      phone: "+1-555-0224",
      currentCompany: "Stripe",
      currentRole: "Product Manager",
      preferredJobType: "full_time",
      expectedHourlyRate: 140,
      experienceYears: 6,
      skills: [
        "Product Management",
        "Fintech",
        "Agile",
        "JIRA",
        "SQL",
        "Analytics",
        "A/B Testing",
      ],
      location: "New York, NY",
      profileCountry: "USA",
      bio: "Product manager driving payments innovation at Stripe with strong analytics background.",
      resumeSummary:
        "Product manager with 6 years leading fintech product strategy and execution.",
      resumeExperience:
        "Stripe (2022–present): PM for checkout experience, 15% conversion lift.\nSquare (2019–2022): PM for merchant dashboard.",
      resumeEducation: "MBA, Wharton School, University of Pennsylvania, 2019",
      resumeAchievements:
        "Shipped features generating $50M+ ARR. Product School mentor.",
      visibilityConfig: { full_time: ["w2", "salary"] },
      profileLocked: true,
    },
  ];

  // ── Profile for the logged-in candidate user (candidate@test.com) ──────
  const candidateProfile = await prisma.candidateProfile.create({
    data: {
      candidateId: candidate.id,
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

  // ── 24 additional browsable candidate profiles ────────────────────────────
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
    `  ✓ Candidate profiles: 1 (logged-in) + ${profiles.length} (browsable) = ${1 + profiles.length} total`,
  );

  // ─── Marketer Company + 25 Rostered Candidates ────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: "Elite Staffing Solutions",
      marketerId: marketer.id,
      marketerEmail: marketer.email,
    },
  });

  // Roster all 24 browsable profiles + the logged-in candidate = 25
  const rosterData = profileData.map((p, i) => ({
    companyId: company.id,
    marketerId: marketer.id,
    candidateId: `seed-candidate-${String(i + 1).padStart(3, "0")}`,
    candidateName: p.name,
    candidateEmail: p.email,
  }));
  rosterData.push({
    companyId: company.id,
    marketerId: marketer.id,
    candidateId: candidate.id,
    candidateName: "Alex Morgan",
    candidateEmail: candidate.email,
  });

  await prisma.marketerCandidate.createMany({ data: rosterData });
  console.log(
    `  ✓ Company: ${company.name}, ${rosterData.length} candidates rostered`,
  );

  // ─── Forwarded Openings (25 — one per job) ────────────────────────────────
  const allEmails = [...profileData.map((p) => p.email), candidate.email];
  const allNames = [...profileData.map((p) => p.name), "Alex Morgan"];

  const forwardedData = jobs.map((job, i) => ({
    marketerId: marketer.id,
    marketerEmail: marketer.email,
    companyId: company.id,
    companyName: company.name,
    candidateEmail: allEmails[i % allEmails.length],
    candidateName: allNames[i % allNames.length],
    jobId: job.id,
    jobTitle: job.title,
    jobLocation: job.location,
    jobType: job.jobType,
    jobSubType: job.jobSubType,
    vendorEmail: vendor.email,
    skillsRequired: job.skillsRequired,
    payPerHour: job.payPerHour,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    note: `Great match for your ${job.skillsRequired.slice(0, 2).join(" & ")} skills!`,
    status: "pending",
  }));

  await prisma.forwardedOpening.createMany({ data: forwardedData });
  console.log(`  ✓ Forwarded openings: ${forwardedData.length} created`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log(`   Jobs: ${jobs.length}`);
  console.log(`   Candidate profiles: ${1 + profiles.length}`);
  console.log(`   Rostered candidates: ${rosterData.length}`);
  console.log(`   Forwarded openings: ${forwardedData.length}`);
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
