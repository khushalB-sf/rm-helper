import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";

const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_DURATION_MS);
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });
    await sendPasswordResetEmail(email, resetToken);
  }

  // Always the same response, whether or not the email exists, to avoid leaking which emails are registered.
  return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
}
