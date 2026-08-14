import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

export async function GET() {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const tests = await prisma.test.findMany({
    where: { user: { managerId: current.userId } },
    select: {
      id: true,
      skill: true,
      yearsOfExperience: true,
      expertiseLevel: true,
      questionCount: true,
      score: true,
      createdAt: true,
      completedAt: true,
      user: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tests });
}
