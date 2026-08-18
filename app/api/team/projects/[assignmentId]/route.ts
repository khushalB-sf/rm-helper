import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

const ASSIGNMENT_SELECT = {
  id: true,
  hoursPerDay: true,
  status: true,
  blocker: true,
  startDate: true,
  endDate: true,
  project: { select: { id: true, name: true, pmCsm: true } },
  user: { select: { id: true, username: true } },
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;
  const { assignmentId } = await params;

  const existing = await prisma.projectAssignment.findUnique({
    where: { id: assignmentId },
    select: { projectId: true, user: { select: { managerId: true } } },
  });
  if (!existing || existing.user.managerId !== current.userId) {
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

  if ("pmCsm" in body) {
    const pmCsm = typeof body.pmCsm === "string" && body.pmCsm.trim() ? body.pmCsm.trim() : null;
    await prisma.project.update({ where: { id: existing.projectId }, data: { pmCsm } });
  }

  if (Object.keys(data).length === 0 && !("pmCsm" in body)) {
    return NextResponse.json({ message: "No changes provided." }, { status: 400 });
  }

  const assignment = await prisma.projectAssignment.update({
    where: { id: assignmentId },
    data,
    select: ASSIGNMENT_SELECT,
  });

  return NextResponse.json({ assignment });
}
