import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const PASSWORD = "Password123";

// real accounts to leave untouched — seed only wipes/recreates its own dummy data
const KEEP_USERNAMES = ["khushal_batham"];

async function main() {
  const keepUsers = await prisma.user.findMany({
    where: { username: { in: KEEP_USERNAMES } },
    select: { id: true, username: true },
  });
  const keepIds = keepUsers.map((u) => u.id);

  // wipe in FK-safe order so this script can be re-run, skipping rows owned by kept accounts
  await prisma.question.deleteMany({ where: { test: { userId: { notIn: keepIds } } } });
  await prisma.test.deleteMany({ where: { userId: { notIn: keepIds } } });
  await prisma.organisationalSessionAttendance.deleteMany({ where: { userId: { notIn: keepIds } } });
  await prisma.internalSession.deleteMany({
    where: { createdById: { notIn: keepIds }, OR: [{ presenterId: null }, { presenterId: { notIn: keepIds } }] },
  });
  await prisma.certification.deleteMany({ where: { userId: { notIn: keepIds } } });
  await prisma.certificationCatalog.deleteMany({ where: { createdById: { notIn: keepIds } } });
  await prisma.goalUpdate.deleteMany({ where: { goal: { ownerId: { notIn: keepIds } } } });
  await prisma.goal.deleteMany({ where: { ownerId: { notIn: keepIds } } });
  await prisma.goalCatalog.deleteMany({ where: { createdById: { notIn: keepIds } } });
  await prisma.projectAssignment.deleteMany({ where: { userId: { notIn: keepIds } } });
  await prisma.project.deleteMany({ where: { assignments: { none: { userId: { in: keepIds } } } } });
  await prisma.userSkill.deleteMany({ where: { userId: { notIn: keepIds } } });
  await prisma.user.deleteMany({ where: { id: { notIn: keepIds } } });

  const password = await bcrypt.hash(PASSWORD, 10);

  // reuse a kept real RM account as the reports' manager if one exists, so team data shows up
  // under it directly instead of a disconnected dummy rm_alice
  const rm =
    keepUsers.find((u) => u.username === "khushal_batham") ??
    (await prisma.user.create({
      data: {
        username: "rm_alice",
        email: "alice.rm@example.com",
        password,
        emailVerified: true,
        role: "RM",
        yearsOfExperience: 9,
        organizations: ["Simform"],
      },
    }));

  const [bob, carol, dave] = await Promise.all([
    prisma.user.create({
      data: {
        username: "bob_dev",
        email: "bob@example.com",
        password,
        emailVerified: true,
        role: "TEAM_MEMBER",
        managerId: rm.id,
        yearsOfExperience: 3,
        organizations: ["Simform"],
      },
    }),
    prisma.user.create({
      data: {
        username: "carol_dev",
        email: "carol@example.com",
        password,
        emailVerified: true,
        role: "TEAM_MEMBER",
        managerId: rm.id,
        yearsOfExperience: 5,
        organizations: ["Simform"],
      },
    }),
    prisma.user.create({
      data: {
        username: "dave_dev",
        email: "dave@example.com",
        password,
        emailVerified: true,
        role: "TEAM_MEMBER",
        managerId: rm.id,
        yearsOfExperience: 1,
        organizations: ["Simform"],
      },
    }),
  ]);

  await prisma.userSkill.createMany({
    data: [
      { userId: bob.id, skill: "React", expertiseLevel: "EXPERT" },
      { userId: bob.id, skill: "Node.js", expertiseLevel: "INTERMEDIATE" },
      { userId: carol.id, skill: "TypeScript", expertiseLevel: "EXPERT" },
      { userId: carol.id, skill: "PostgreSQL", expertiseLevel: "INTERMEDIATE" },
      { userId: dave.id, skill: "JavaScript", expertiseLevel: "NEW" },
      { userId: dave.id, skill: "CSS", expertiseLevel: "INTERMEDIATE" },
    ],
  });

  const [projectAlpha, projectBeta] = await Promise.all([
    prisma.project.create({
      data: { name: "Project Alpha", client: "Acme Corp", pmCsm: "Nina PM", startDate: new Date("2026-01-15") },
    }),
    prisma.project.create({
      data: { name: "Project Beta", client: "Globex", pmCsm: "Tom CSM", startDate: new Date("2026-04-01") },
    }),
  ]);

  await prisma.projectAssignment.createMany({
    data: [
      { userId: bob.id, projectId: projectAlpha.id, hoursPerDay: 8, status: "Active" },
      { userId: carol.id, projectId: projectAlpha.id, hoursPerDay: 4, status: "Active" },
      { userId: carol.id, projectId: projectBeta.id, hoursPerDay: 4, status: "Active" },
      { userId: dave.id, projectId: projectBeta.id, hoursPerDay: 8, status: "Blocked", blocker: "Waiting on client access" },
    ],
  });

  const goalBob = await prisma.goal.create({
    data: {
      ownerId: bob.id,
      assignedById: rm.id,
      type: "DEPARTMENTAL",
      title: "Get AWS Certified",
      description: "Complete AWS Solutions Architect Associate certification.",
      progressPct: 60,
      status: "IN_PROGRESS",
      lastCompletionDate: new Date("2026-10-01"),
    },
  });
  await prisma.goalUpdate.create({
    data: { goalId: goalBob.id, progressPct: 60, note: "Finished practice exams, scheduling the real one." },
  });

  await prisma.goal.create({
    data: {
      ownerId: carol.id,
      type: "BENCH",
      title: "Learn Next.js App Router",
      progressPct: 100,
      status: "COMPLETED",
      lastCompletionDate: new Date("2026-06-01"),
      completionDate: new Date("2026-05-20"),
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: dave.id,
      assignedById: rm.id,
      type: "DEPARTMENTAL",
      title: "Onboarding checklist",
      progressPct: 0,
      status: "NOT_STARTED",
      lastCompletionDate: new Date("2026-09-01"),
    },
  });

  await prisma.certification.createMany({
    data: [
      { userId: bob.id, name: "AWS Solutions Architect", status: "APPLIED", appliedDate: new Date("2026-07-01") },
      {
        userId: carol.id,
        assignedById: rm.id,
        name: "Certified Scrum Master",
        status: "PASSED",
        score: 90,
        maxScore: 100,
        appliedDate: new Date("2026-02-01"),
        resultDate: new Date("2026-02-20"),
      },
      { userId: dave.id, name: "JavaScript Fundamentals", status: "FAILED", score: 40, maxScore: 100 },
    ],
  });

  const session = await prisma.internalSession.create({
    data: {
      title: "Intro to Prisma 7",
      description: "Walkthrough of the new driver adapter API and migration workflow.",
      createdById: rm.id,
      presenterId: carol.id,
      conductedDate: new Date("2026-07-10"),
      recordingUrl: "https://example.com/recording/prisma-7",
    },
  });
  void session;

  await prisma.organisationalSessionAttendance.createMany({
    data: [
      { userId: bob.id, title: "Company All Hands", attendedDate: new Date("2026-06-15") },
      { userId: carol.id, title: "Security Awareness Training", attendedDate: new Date("2026-05-20") },
      { userId: dave.id, title: "Company All Hands", attendedDate: new Date("2026-06-15") },
    ],
  });

  const test = await prisma.test.create({
    data: {
      userId: bob.id,
      skill: "React",
      yearsOfExperience: 3,
      expertiseLevel: "EXPERT",
      questionCount: 2,
      score: 1,
      completedAt: new Date("2026-07-05"),
      goalId: goalBob.id,
    },
  });
  await prisma.question.createMany({
    data: [
      {
        testId: test.id,
        question: "What hook lets you memoize a computed value?",
        options: ["useMemo", "useEffect", "useRef", "useState"],
        correctAnswer: "useMemo",
        explanation: "useMemo memoizes a computed value between renders.",
        userAnswer: "useMemo",
        isCorrect: true,
      },
      {
        testId: test.id,
        question: "Which lifecycle method has no function-component hook equivalent by name?",
        options: ["componentDidMount", "componentDidCatch", "render", "constructor"],
        correctAnswer: "componentDidCatch",
        explanation: "Error boundaries still require class components in React 19.",
        userAnswer: "componentDidMount",
        isCorrect: false,
      },
    ],
  });

  console.log("Seeded users (password for dummy accounts: %s):", PASSWORD);
  console.log("  RM (manager of bob/carol/dave): %s", rm.username);
  console.log("  TEAM_MEMBER: bob_dev / bob@example.com");
  console.log("  TEAM_MEMBER: carol_dev / carol@example.com");
  console.log("  TEAM_MEMBER: dave_dev / dave@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
