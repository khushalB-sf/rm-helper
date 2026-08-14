import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";
import { parseSkillEntries, replaceSkills } from "@/lib/userSkills";

async function requireOwnReport(managerId: string, userId: string) {
  const report = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
  return report?.managerId === managerId;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;
  const { userId } = await params;

  if (!(await requireOwnReport(current.userId, userId))) {
    return NextResponse.json({ message: "Not your report." }, { status: 403 });
  }

  const skills = await prisma.userSkill.findMany({
    where: { userId },
    select: { skill: true, expertiseLevel: true },
    orderBy: { skill: "asc" },
  });
  return NextResponse.json({ skills });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;
  const { userId } = await params;

  if (!(await requireOwnReport(current.userId, userId))) {
    return NextResponse.json({ message: "Not your report." }, { status: 403 });
  }

  const body = await request.json();
  const entries = parseSkillEntries(body.skills);
  if (entries === null) return NextResponse.json({ message: "Invalid skills." }, { status: 400 });

  await replaceSkills(userId, entries);
  return NextResponse.json({ skills: entries });
}
