import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const { error } = await requireApiRole("RM");
  if (error) return error;

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ candidates: [] });

  const candidates = await prisma.user.findMany({
    where: {
      role: "TEAM_MEMBER",
      managerId: null,
      OR: [{ username: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
    },
    select: { id: true, username: true, email: true },
    orderBy: { username: "asc" },
    take: 10,
  });

  return NextResponse.json({ candidates });
}
