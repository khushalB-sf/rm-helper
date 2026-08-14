import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const { assignmentId } = await params;

  const existing = await prisma.projectAssignment.findUnique({ where: { id: assignmentId }, select: { userId: true } });
  if (!existing || existing.userId !== session.userId) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const body = await request.json();
  const data: { hoursPerDay?: number; status?: string; blocker?: string | null; endDate?: Date } = {};

  if ("hoursPerDay" in body) {
    const hoursPerDay = Number(body.hoursPerDay);
    if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 24) {
      return NextResponse.json({ message: "Hours/day must be between 0 and 24." }, { status: 400 });
    }
    data.hoursPerDay = hoursPerDay;
  }

  if ("status" in body) {
    const status = String(body.status ?? "").trim();
    if (!status) return NextResponse.json({ message: "Status is required." }, { status: 400 });
    data.status = status;
  }

  if ("blocker" in body) {
    data.blocker = typeof body.blocker === "string" && body.blocker.trim() ? body.blocker.trim() : null;
  }

  if (body.ended === true) {
    data.endDate = new Date();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "No changes provided." }, { status: 400 });
  }

  const assignment = await prisma.projectAssignment.update({
    where: { id: assignmentId },
    data,
    select: {
      id: true,
      hoursPerDay: true,
      status: true,
      blocker: true,
      startDate: true,
      endDate: true,
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ assignment });
}
