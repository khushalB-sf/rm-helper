import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const ATTENDANCE_SELECT = { id: true, title: true, attendedDate: true, notes: true };

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const attendance = await prisma.organisationalSessionAttendance.findMany({
    where: { userId: session.userId as string },
    select: ATTENDANCE_SELECT,
    orderBy: { attendedDate: "desc" },
  });

  return NextResponse.json({ attendance });
}

/** No app-managed catalog of organisational sessions exists — this is a free-text personal log. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const attendedDate = body.attendedDate ? new Date(body.attendedDate) : null;
  const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

  if (!title) return NextResponse.json({ message: "Session title is required." }, { status: 400 });
  if (!attendedDate || Number.isNaN(attendedDate.getTime())) {
    return NextResponse.json({ message: "A valid attended date is required." }, { status: 400 });
  }

  const entry = await prisma.organisationalSessionAttendance.create({
    data: { userId: session.userId as string, title, attendedDate, notes },
    select: ATTENDANCE_SELECT,
  });

  return NextResponse.json({ entry });
}
