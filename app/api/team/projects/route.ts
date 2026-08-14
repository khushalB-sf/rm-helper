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

export async function GET() {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const assignments = await prisma.projectAssignment.findMany({
    where: { user: { managerId: current.userId } },
    select: ASSIGNMENT_SELECT,
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ assignments });
}

/** RM creates/reuses a project and assigns a report to it — the report then updates their own status/hours/blocker. */
export async function POST(request: NextRequest) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const projectName = String(body.projectName ?? "").trim();
  const hoursPerDay = Number(body.hoursPerDay);
  const status = String(body.status ?? "ON_TRACK").trim();
  const pmCsm = typeof body.pmCsm === "string" && body.pmCsm.trim() ? body.pmCsm.trim() : null;

  if (!projectName) return NextResponse.json({ message: "Project name is required." }, { status: 400 });
  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 24) {
    return NextResponse.json({ message: "Hours/day must be between 0 and 24." }, { status: 400 });
  }

  const report = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
  if (report?.managerId !== current.userId) {
    return NextResponse.json({ message: "Not your report." }, { status: 403 });
  }

  const project = await prisma.project.upsert({
    where: { name: projectName },
    update: pmCsm ? { pmCsm } : {},
    create: { name: projectName, pmCsm },
  });

  const assignment = await prisma.projectAssignment.create({
    data: { userId, projectId: project.id, hoursPerDay, status },
    select: ASSIGNMENT_SELECT,
  });

  return NextResponse.json({ assignment });
}
