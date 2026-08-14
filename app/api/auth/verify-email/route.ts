import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ message: "Missing verification token." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { verificationToken: token } });
  if (!user) {
    return NextResponse.json(
      { message: "This verification link is invalid or has already been used." },
      { status: 400 },
    );
  }

  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, verificationToken: null } });

  return NextResponse.json({ message: "Your email has been verified. You can now log in." });
}
