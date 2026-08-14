import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

const CERT_SELECT = {
  id: true,
  name: true,
  status: true,
  score: true,
  maxScore: true,
  appliedDate: true,
  resultDate: true,
  user: { select: { id: true, username: true } },
};

export async function GET() {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const certifications = await prisma.certification.findMany({
    where: { user: { managerId: current.userId } },
    select: CERT_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ certifications });
}

/** RM assigns a certification to a report — the team member can only record their attempt date and result on it. */
export async function POST(request: NextRequest) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "Certification name is required." }, { status: 400 });

  const report = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
  if (report?.managerId !== current.userId) {
    return NextResponse.json({ message: "Not your report." }, { status: 403 });
  }

  const certification = await prisma.certification.create({
    data: { userId, assignedById: current.userId, name },
    select: CERT_SELECT,
  });

  return NextResponse.json({ certification });
}
