import "server-only";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await sendMail(
    email,
    "Verify your email",
    `<p>Click the link below to verify your email:</p><p><a href="${link}">${link}</a></p>`,
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await sendMail(
    email,
    "Reset your password",
    `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`,
  );
}
