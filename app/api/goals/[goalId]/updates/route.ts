import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { GoalStatus } from "@/app/generated/prisma/client";

function statusForProgress(progressPct: number): GoalStatus {
  if (progressPct >= 100) return "COMPLETED";
  if (progressPct > 0) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const { goalId } = await params;

  const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { ownerId: true } });
  if (!goal || goal.ownerId !== session.userId) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const updates = await prisma.goalUpdate.findMany({
    where: { goalId },
    orderBy: { createdAt: "desc" },
    select: { id: true, progressPct: true, note: true, createdAt: true },
  });
  return NextResponse.json({ updates });
}

/** Weekly progress update — appends to the history log and refreshes the goal's current progress/status. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const { goalId } = await params;

  const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { ownerId: true } });
  if (!goal || goal.ownerId !== session.userId) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const body = await request.json();
  const progressPct = Number(body.progressPct);
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

  if (!Number.isInteger(progressPct) || progressPct < 0 || progressPct > 100) {
    return NextResponse.json({ message: "Progress must be a number between 0 and 100." }, { status: 400 });
  }

  const [update] = await prisma.$transaction([
    prisma.goalUpdate.create({ data: { goalId, progressPct, note }, select: { id: true, progressPct: true, note: true, createdAt: true } }),
    prisma.goal.update({ where: { id: goalId }, data: { progressPct, status: statusForProgress(progressPct) } }),
  ]);

  return NextResponse.json({ update });
}
