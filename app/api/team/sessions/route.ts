import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

const SESSION_SELECT = {
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
};

export async function GET() {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const sessions = await prisma.internalSession.findMany({
    where: { createdById: current.userId },
    select: SESSION_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

/** RM defines and assigns internal sessions — a presenter can be set now or later via the assign endpoint. */
export async function POST(request: NextRequest) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  if (!title) return NextResponse.json({ message: "Title is required." }, { status: 400 });

  let presenterId: string | null = null;
  if (body.presenterId) {
    const report = await prisma.user.findUnique({ where: { id: body.presenterId }, select: { managerId: true } });
    if (report?.managerId !== current.userId) {
      return NextResponse.json({ message: "Not your report." }, { status: 403 });
    }
    presenterId = body.presenterId;
  }

  const created = await prisma.internalSession.create({
    data: { title, description, createdById: current.userId, presenterId },
    select: SESSION_SELECT,
  });

  return NextResponse.json({ session: created });
}
