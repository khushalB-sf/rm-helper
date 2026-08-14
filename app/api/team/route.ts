import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

export async function GET() {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const reports = await prisma.user.findMany({
    where: { managerId: current.userId },
    select: { id: true, username: true, email: true, createdAt: true },
    orderBy: { username: "asc" },
  });

  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const body = await request.json();
  const userId = String(body.userId ?? "");
  if (!userId) return NextResponse.json({ message: "userId is required." }, { status: 400 });

  const candidate = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, managerId: true } });
  if (!candidate || candidate.role !== "TEAM_MEMBER") {
    return NextResponse.json({ message: "No such team member." }, { status: 404 });
  }
  if (candidate.managerId) {
    return NextResponse.json({ message: "That person already has a manager." }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { managerId: current.userId },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  return NextResponse.json({ report: updated });
}
