import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";

export async function GET() {
  const { error } = await requireApiRole("RM");
  if (error) return error;

  const catalog = await prisma.certificationCatalog.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ catalog });
}

/** RM adds a new certification name to the shared catalog used by the assign dropdown. */
export async function POST(request: NextRequest) {
  const { current, error } = await requireApiRole("RM");
  if (error) return error;

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "Certification name is required." }, { status: 400 });

  const existing = await prisma.certificationCatalog.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ catalogEntry: existing });

  const catalogEntry = await prisma.certificationCatalog.create({
    data: { name, createdById: current.userId },
    select: { id: true, name: true },
  });

  return NextResponse.json({ catalogEntry });
}
