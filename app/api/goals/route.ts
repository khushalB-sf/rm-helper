import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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
  assignedBy: { select: { username: true } },
  tests: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { id: true, score: true, questionCount: true, completedAt: true },
  },
};

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { ownerId: session.userId as string },
    select: GOAL_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}
