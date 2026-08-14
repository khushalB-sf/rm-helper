import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ attendanceId: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const { attendanceId } = await params;

  const existing = await prisma.organisationalSessionAttendance.findUnique({
    where: { id: attendanceId },
    select: { userId: true },
  });
  if (!existing || existing.userId !== session.userId) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const body = await request.json();
  const data: { title?: string; attendedDate?: Date; notes?: string | null } = {};

  if ("title" in body) {
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ message: "Session title is required." }, { status: 400 });
    data.title = title;
  }
  if ("attendedDate" in body) {
    const attendedDate = new Date(body.attendedDate);
    if (Number.isNaN(attendedDate.getTime())) return NextResponse.json({ message: "Invalid date." }, { status: 400 });
    data.attendedDate = attendedDate;
  }
  if ("notes" in body) {
    data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }

  const entry = await prisma.organisationalSessionAttendance.update({
    where: { id: attendanceId },
    data,
    select: { id: true, title: true, attendedDate: true, notes: true },
  });

  return NextResponse.json({ entry });
}
