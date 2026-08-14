import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");

  const passwordError = validatePassword(password);
  if (passwordError) return NextResponse.json({ errors: { password: passwordError } }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
  });

  return NextResponse.json({ redirectTo: "/login?reset=1" });
}
