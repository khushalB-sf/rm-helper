import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { username: true, email: true, role: true },
  });
  if (!user) return NextResponse.json({ message: "Not found." }, { status: 404 });

  return NextResponse.json(user);
}
