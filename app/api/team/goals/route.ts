import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

export async function GET() {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const goals = await prisma.goal.findMany({
    where: { owner: { managerId: current.userId } },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      progressPct: true,
      status: true,
      lastCompletionDate: true,
      completionDate: true,
      createdAt: true,
      owner: { select: { id: true, username: true } },
      tests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { score: true, questionCount: true, completedAt: true },
      },
      updates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}

const GOAL_SELECT = {
  id: true,
  type: true,
  title: true,
  description: true,
  progressPct: true,
  status: true,
  lastCompletionDate: true,
  completionDate: true,
  createdAt: true,
  owner: { select: { id: true, username: true } },
  tests: { select: { score: true, questionCount: true, completedAt: true } },
  updates: { orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true } },
};

/** RM assigns a departmental (or bench) goal to one report, or all of them at once. */
export async function POST(request: NextRequest) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const type = body.type === "BENCH" ? "BENCH" : "DEPARTMENTAL";
  const title = String(body.title ?? "").trim();
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;

  if (!title) return NextResponse.json({ message: "Title is required." }, { status: 400 });

  let lastCompletionDate: Date;
  if (type === "BENCH") {
    lastCompletionDate = body.lastCompletionDate ? new Date(body.lastCompletionDate) : new Date(NaN);
    if (Number.isNaN(lastCompletionDate.getTime())) {
      return NextResponse.json({ message: "Last date of completion is required for bench goals." }, { status: 400 });
    }
  } else {
    lastCompletionDate = new Date(new Date().getFullYear(), 11, 31);
  }

  if (userId === "ALL") {
    const reports = await prisma.user.findMany({ where: { managerId: current.userId }, select: { id: true } });
    if (reports.length === 0) return NextResponse.json({ message: "You have no team members." }, { status: 400 });

    const alreadyHave = await prisma.goal.findMany({
      where: { title, status: { in: ["NOT_STARTED", "IN_PROGRESS"] }, ownerId: { in: reports.map((r) => r.id) } },
      select: { ownerId: true },
    });
    const alreadyHaveIds = new Set(alreadyHave.map((g) => g.ownerId));
    const toAssign = reports.filter((r) => !alreadyHaveIds.has(r.id));

    if (toAssign.length === 0) {
      return NextResponse.json({ message: "Every team member already has this goal." }, { status: 400 });
    }

    const goals = await prisma.$transaction(
      toAssign.map((report) =>
        prisma.goal.create({
          data: { ownerId: report.id, assignedById: current.userId, type, title, description, lastCompletionDate },
          select: GOAL_SELECT,
        })
      )
    );

    return NextResponse.json({ goals, skipped: alreadyHaveIds.size });
  }

  const report = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
  if (report?.managerId !== current.userId) {
    return NextResponse.json({ message: "Not your report." }, { status: 403 });
  }

  const existing = await prisma.goal.findFirst({
    where: { ownerId: userId, title, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ message: "This team member already has this goal." }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: { ownerId: userId, assignedById: current.userId, type, title, description, lastCompletionDate },
    select: GOAL_SELECT,
  });

  return NextResponse.json({ goal });
}
