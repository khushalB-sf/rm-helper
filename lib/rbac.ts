import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Role } from "@/app/generated/prisma/client";

/**
 * Role is looked up fresh from the DB on every call rather than embedded in the session JWT,
 * so a role change takes effect immediately instead of waiting for the token to refresh.
 */
export async function getCurrentUserRole() {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { role: true },
  });
  if (!user) return null;

  return { userId: session.userId as string, role: user.role };
}

/** Server Component / page guard — redirects instead of rendering role-gated content. */
export async function requirePageRole(role: Role) {
  const current = await getCurrentUserRole();
  if (!current) redirect("/login");
  if (current.role !== role) redirect("/");
  return current;
}

/** Route handler guard — returns an error response to `return` directly, instead of throwing. */
export async function requireApiRole(role: Role) {
  const current = await getCurrentUserRole();
  if (!current) {
    return { current: null, error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  }
  if (current.role !== role) {
    return { current: null, error: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }
  return { current, error: null };
}
