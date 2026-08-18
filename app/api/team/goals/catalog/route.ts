import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

export async function GET() {
  const { error } = await requireApiRole("RM");
  if (error) return error;

  const catalog = await prisma.goalCatalog.findMany({
    select: { id: true, title: true, type: true },
    orderBy: { title: "asc" },
  });

  return NextResponse.json({ catalog });
}

/** RM adds a new goal title to the shared catalog used by the assign dropdown, scoped to a type. */
export async function POST(request: NextRequest) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const type = body.type === "BENCH" ? "BENCH" : "DEPARTMENTAL";
  if (!title) return NextResponse.json({ message: "Goal title is required." }, { status: 400 });

  const existing = await prisma.goalCatalog.findUnique({ where: { title_type: { title, type } } });
  if (existing) return NextResponse.json({ catalogEntry: existing });

  const catalogEntry = await prisma.goalCatalog.create({
    data: { title, type, createdById: current.userId },
    select: { id: true, title: true, type: true },
  });

  return NextResponse.json({ catalogEntry });
}
