import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** Project assignments are created by the RM (see /api/team/projects) — team members only update status/hours/blocker on their own. */
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const assignments = await prisma.projectAssignment.findMany({
    where: { userId: session.userId as string },
    select: {
      id: true,
      hoursPerDay: true,
      status: true,
      blocker: true,
      startDate: true,
      endDate: true,
      project: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ assignments });
}
