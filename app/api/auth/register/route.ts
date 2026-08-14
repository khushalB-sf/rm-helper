import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";
import { validateUsername, validateEmail, validatePassword } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = String(body.username ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const errors: Record<string, string> = {};
  const usernameError = validateUsername(username);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (usernameError) errors.username = usernameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (Object.keys(errors).length > 0) return NextResponse.json({ errors }, { status: 400 });

  const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) {
    const field = existing.username === username ? "username" : "email";
    return NextResponse.json({ errors: { [field]: "Already in use." } }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = randomBytes(32).toString("hex");

  await prisma.user.create({
    data: { username, email, password: hashedPassword, verificationToken },
  });

  await sendVerificationEmail(email, verificationToken);

  return NextResponse.json({ redirectTo: "/login?registered=1" });
}
