import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

export async function GET() {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const attendance = await prisma.organisationalSessionAttendance.findMany({
    where: { user: { managerId: current.userId } },
    select: { id: true, title: true, attendedDate: true, notes: true, user: { select: { id: true, username: true } } },
    orderBy: { attendedDate: "desc" },
  });

  return NextResponse.json({ attendance });
}
