import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;
  const { userId } = await params;

  const report = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
  if (report?.managerId !== current.userId) {
    return NextResponse.json({ message: "Not your report." }, { status: 403 });
  }

  const assignments = await prisma.projectAssignment.findMany({
    where: { userId, endDate: null },
    select: {
      id: true,
      hoursPerDay: true,
      status: true,
      blocker: true,
      startDate: true,
      project: { select: { name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ assignments });
}
