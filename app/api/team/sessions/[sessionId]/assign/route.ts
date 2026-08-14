import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

/** RM assigns (or reassigns) which report presents a session they created — can happen any time after creation too. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;
  const { sessionId } = await params;

  const session = await prisma.internalSession.findUnique({ where: { id: sessionId }, select: { createdById: true } });
  if (!session || session.createdById !== current.userId) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const body = await request.json();
  const presenterId = String(body.presenterId ?? "");
  const report = await prisma.user.findUnique({ where: { id: presenterId }, select: { managerId: true } });
  if (report?.managerId !== current.userId) {
    return NextResponse.json({ message: "Not your report." }, { status: 403 });
  }

  const updated = await prisma.internalSession.update({
    where: { id: sessionId },
    data: { presenterId },
    select: {
      id: true,
      title: true,
      description: true,
      presenterId: true,
      presenter: { select: { username: true } },
      conductedDate: true,
      recordingUrl: true,
      presentationUrl: true,
      githubUrl: true,
      referenceUrl: true,
    },
  });

  return NextResponse.json({ session: updated });
}
