import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const CERT_SELECT = {
  id: true,
  name: true,
  status: true,
  score: true,
  maxScore: true,
  appliedDate: true,
  resultDate: true,
  assignedBy: { select: { username: true } },
};

/** Certifications are assigned by the RM (see /api/team/certifications) — team members only record their attempt/result. */
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const certifications = await prisma.certification.findMany({
    where: { userId: session.userId as string },
    select: CERT_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ certifications });
}
