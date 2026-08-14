import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** A team member only sees sessions their manager has assigned to them, not the whole catalog. */
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const sessions = await prisma.internalSession.findMany({
    where: { presenterId: session.userId as string },
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sessions });
}
