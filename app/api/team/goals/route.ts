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
      dueDate: true,
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

/** RM assigns a departmental (or bench) goal to one of their reports. */
export async function POST(request: NextRequest) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const type = body.type === "BENCH" ? "BENCH" : "DEPARTMENTAL";
  const title = String(body.title ?? "").trim();
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (!title) return NextResponse.json({ message: "Title is required." }, { status: 400 });
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ message: "Invalid due date." }, { status: 400 });
  }

  const report = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
  if (report?.managerId !== current.userId) {
    return NextResponse.json({ message: "Not your report." }, { status: 403 });
  }

  const goal = await prisma.goal.create({
    data: { ownerId: userId, assignedById: current.userId, type, title, description, dueDate },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      progressPct: true,
      status: true,
      dueDate: true,
      createdAt: true,
      owner: { select: { id: true, username: true } },
      tests: { select: { score: true, questionCount: true, completedAt: true } },
      updates: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  return NextResponse.json({ goal });
}
