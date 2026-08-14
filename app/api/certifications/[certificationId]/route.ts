import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const STATUSES = new Set(["APPLIED", "PASSED", "FAILED"]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ certificationId: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const { certificationId } = await params;

  const existing = await prisma.certification.findUnique({ where: { id: certificationId }, select: { userId: true } });
  if (!existing || existing.userId !== session.userId) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const body = await request.json();
  const status = body.status;
  if (!STATUSES.has(status)) return NextResponse.json({ message: "Invalid status." }, { status: 400 });

  const score = body.score === null || body.score === undefined ? null : Number(body.score);
  const maxScore = body.maxScore === null || body.maxScore === undefined ? null : Number(body.maxScore);
  if (score !== null && !Number.isFinite(score)) return NextResponse.json({ message: "Invalid score." }, { status: 400 });
  if (maxScore !== null && !Number.isFinite(maxScore)) return NextResponse.json({ message: "Invalid max score." }, { status: 400 });

  const appliedDate = body.appliedDate ? new Date(body.appliedDate) : new Date();
  if (Number.isNaN(appliedDate.getTime())) return NextResponse.json({ message: "Invalid attempted-on date." }, { status: 400 });

  const certification = await prisma.certification.update({
    where: { id: certificationId },
    data: { status, score, maxScore, appliedDate, resultDate: status === "APPLIED" ? null : new Date() },
    select: { id: true, name: true, status: true, score: true, maxScore: true, appliedDate: true, resultDate: true },
  });

  return NextResponse.json({ certification });
}
