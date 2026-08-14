import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** A team member logs delivery details (date, recording, resources) on a session their RM already assigned to them. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const { sessionId } = await params;
  const userId = session.userId as string;

  const existing = await prisma.internalSession.findUnique({ where: { id: sessionId }, select: { presenterId: true } });
  if (!existing || existing.presenterId !== userId) {
    return NextResponse.json({ message: "This session isn't assigned to you." }, { status: 403 });
  }

  const body = await request.json();
  const conductedDate = body.conductedDate ? new Date(body.conductedDate) : null;
  if (body.conductedDate && Number.isNaN(conductedDate?.getTime())) {
    return NextResponse.json({ message: "Invalid date." }, { status: 400 });
  }

  const updated = await prisma.internalSession.update({
    where: { id: sessionId },
    data: {
      conductedDate,
      recordingUrl: typeof body.recordingUrl === "string" && body.recordingUrl.trim() ? body.recordingUrl.trim() : null,
      presentationUrl: typeof body.presentationUrl === "string" && body.presentationUrl.trim() ? body.presentationUrl.trim() : null,
      githubUrl: typeof body.githubUrl === "string" && body.githubUrl.trim() ? body.githubUrl.trim() : null,
      referenceUrl: typeof body.referenceUrl === "string" && body.referenceUrl.trim() ? body.referenceUrl.trim() : null,
    },
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
